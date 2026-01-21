import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, scrapeWithRetry, validateScrapedContent, cleanMarkdownContent } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";
import { detectBroker, normalizeCityName } from "../_shared/broker-detection.ts";
import { fetchScoutSettings } from "../_shared/settings.ts";

/**
 * Standalone Edge Function for scraping Homeless ONLY
 * Runs independently with Homeless-specific configuration
 */

interface ScrapedProperty {
  source: string;
  source_url: string;
  source_id: string;
  title?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  price?: number;
  rooms?: number;
  size?: number;
  floor?: number;
  property_type: 'rent' | 'sale';
  description?: string;
  images?: string[];
  features?: Record<string, boolean>;
  raw_data?: any;
  is_private?: boolean | null;
}

// Homeless-specific configuration
const HOMELESS_CONFIG = {
  SOURCE: 'homeless',
  MAX_PAGES: 5,
  PAGE_DELAY_MS: 2000,
  WAIT_FOR_MS: 3000,
  MAX_RETRIES: 2
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch global settings (used as fallback)
  const settings = await fetchScoutSettings(supabase);
  
  console.log(`🟣 scout-homeless: Starting`);

  let runId: string | undefined;

  try {
    // Get only Homeless configs
    const { data: configs, error: configError } = await supabase
      .from('scout_configs')
      .select('*')
      .eq('is_active', true)
      .eq('source', 'homeless');

    if (configError) throw configError;

    if (!configs || configs.length === 0) {
      console.log('No active Homeless configurations found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active Homeless configurations',
        properties_found: 0,
        new_properties: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let totalPropertiesFound = 0;
    let totalNewProperties = 0;

    for (const config of configs) {
      // Get config-specific parameters with fallback chain: config -> settings -> default
      const configMaxPages = config.max_pages ?? settings.scraping.homeless_pages ?? HOMELESS_CONFIG.MAX_PAGES;
      const configPageDelay = (config.page_delay_seconds ?? HOMELESS_CONFIG.PAGE_DELAY_MS / 1000) * 1000;
      const configWaitFor = config.wait_for_ms ?? HOMELESS_CONFIG.WAIT_FOR_MS;
      
      console.log(`Processing Homeless config: ${config.name} (pages: ${configMaxPages}, delay: ${configPageDelay}ms, wait: ${configWaitFor}ms)`);

      // Check for existing running job
      const { data: existingRun } = await supabase
        .from('scout_runs')
        .select('id')
        .eq('config_id', config.id)
        .eq('status', 'running')
        .single();

      if (existingRun) {
        console.log(`⏭️ Config ${config.name} already has a running job, skipping`);
        continue;
      }

      // Create run record
      const { data: runData, error: runError } = await supabase
        .from('scout_runs')
        .insert({
          config_id: config.id,
          source: 'homeless',
          status: 'running'
        })
        .select()
        .single();

      if (runError) {
        console.error('Failed to create run record:', runError);
        continue;
      }
      runId = runData.id;
      console.log(`Created run ${runId} for Homeless`);

      let configPropertiesFound = 0;
      let configNewProperties = 0;

      for (let page = 1; page <= configMaxPages; page++) {
        const urls = buildSinglePageUrl(config, page);
        if (!urls.length) continue;

        const url = urls[0];
        console.log(`🟣 Homeless: Scraping page ${page}/${configMaxPages}: ${url}`);

        // Add delay between pages (not for first page)
        if (page > 1) {
          const delay = configPageDelay + Math.random() * 1000;
          console.log(`Waiting ${Math.round(delay)}ms before next Homeless page...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
          if (!firecrawlApiKey) {
            console.warn('FIRECRAWL_API_KEY not configured');
            break;
          }

          const scrapeData = await scrapeWithRetry(url, firecrawlApiKey, 'homeless', HOMELESS_CONFIG.MAX_RETRIES);
          
          if (!scrapeData) {
            console.error(`All retry attempts failed for Homeless page ${page}`);
            continue;
          }

          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          const html = scrapeData.data?.html || scrapeData.html || '';

          const validation = validateScrapedContent(markdown, html, 'homeless');
          if (!validation.valid) {
            console.error(`Homeless content validation failed: ${validation.reason}`);
            await supabase
              .from('scout_runs')
              .update({ status: 'partial', error_message: validation.reason })
              .eq('id', runId);
            continue;
          }

          if (!lovableApiKey) {
            console.warn('LOVABLE_API_KEY not configured');
            break;
          }

          const extractedProperties = await extractPropertiesWithAI(
            markdown, html, url,
            config.property_type === 'both' ? 'rent' : config.property_type,
            lovableApiKey, config.cities
          );

          console.log(`🟣 Homeless page ${page}: Extracted ${extractedProperties.length} properties`);

          // Save properties
          for (const property of extractedProperties) {
            const result = await saveProperty(supabase, property);
            if (result.isNew) {
              configNewProperties++;
              totalNewProperties++;
            }
          }

          configPropertiesFound += extractedProperties.length;
          totalPropertiesFound += extractedProperties.length;

          // Update progress
          await supabase
            .from('scout_runs')
            .update({
              properties_found: configPropertiesFound,
              new_properties: configNewProperties
            })
            .eq('id', runId);

        } catch (error) {
          console.error(`Error on Homeless page ${page}:`, error);
          continue;
        }
      }

      // Complete run
      await supabase
        .from('scout_runs')
        .update({
          status: 'completed',
          properties_found: configPropertiesFound,
          new_properties: configNewProperties,
          completed_at: new Date().toISOString()
        })
        .eq('id', runId);

      // Update config last run
      await supabase
        .from('scout_configs')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'completed',
          last_run_results: { properties_found: configPropertiesFound }
        })
        .eq('id', config.id);

      console.log(`✅ Homeless config ${config.name}: ${configPropertiesFound} found, ${configNewProperties} new`);
    }

    return new Response(JSON.stringify({
      success: true,
      source: 'homeless',
      properties_found: totalPropertiesFound,
      new_properties: totalNewProperties
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('scout-homeless error:', error);
    
    if (runId) {
      await supabase
        .from('scout_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', runId);
    }

    return new Response(JSON.stringify({
      success: false,
      source: 'homeless',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ==================== Helper Functions ====================

async function saveProperty(supabase: any, property: ScrapedProperty): Promise<{ isNew: boolean }> {
  const normalizedCity = normalizeCityName(property.city);
  
  let duplicateGroupId: string | null = null;
  let isPrimaryListing = true;
  const addressHasBuildingNumber = property.address && /\d+/.test(property.address);
  const duplicateCheckPossible = addressHasBuildingNumber && !!property.rooms && !!normalizedCity;
  
  if (duplicateCheckPossible) {
    const { data: duplicates } = await supabase
      .rpc('find_duplicate_property', {
        p_address: property.address,
        p_rooms: property.rooms,
        p_floor: property.floor || 0,
        p_property_type: property.property_type || 'rental',
        p_city: normalizedCity,
        p_exclude_id: null
      });
    
    if (duplicates && duplicates.length > 0) {
      const primaryDuplicate = duplicates[0];
      duplicateGroupId = primaryDuplicate.duplicate_group_id || primaryDuplicate.id;
      isPrimaryListing = false;
      
      if (!primaryDuplicate.duplicate_group_id) {
        await supabase
          .from('scouted_properties')
          .update({ 
            duplicate_group_id: duplicateGroupId,
            duplicate_detected_at: new Date().toISOString()
          })
          .eq('id', primaryDuplicate.id);
      }
    }
  }
  
  const { data: upsertResult, error: upsertError } = await supabase
    .from('scouted_properties')
    .upsert({
      source: property.source,
      source_url: property.source_url,
      source_id: property.source_id,
      title: property.title,
      city: normalizedCity,
      neighborhood: property.neighborhood,
      address: property.address,
      price: property.price,
      rooms: property.rooms,
      size: property.size,
      floor: property.floor,
      duplicate_check_possible: duplicateCheckPossible,
      property_type: property.property_type,
      description: property.description,
      images: property.images || [],
      features: property.features || {},
      raw_data: property.raw_data,
      status: 'new',
      is_private: property.is_private,
      duplicate_group_id: duplicateGroupId,
      is_primary_listing: isPrimaryListing,
      duplicate_detected_at: duplicateGroupId ? new Date().toISOString() : null,
      last_seen_at: new Date().toISOString()
    }, {
      onConflict: 'source,source_id',
      ignoreDuplicates: true
    })
    .select('id, price')
    .single();

  if (!upsertError && upsertResult) {
    if (duplicateGroupId && property.price) {
      const { data: primaryProperty } = await supabase
        .from('scouted_properties')
        .select('id, price')
        .eq('duplicate_group_id', duplicateGroupId)
        .eq('is_primary_listing', true)
        .single();
      
      if (primaryProperty?.price && primaryProperty.price > 0) {
        const priceDiff = Math.abs(property.price - primaryProperty.price);
        const priceDiffPercent = (priceDiff / Math.min(property.price, primaryProperty.price)) * 100;
        
        if (priceDiffPercent > 5) {
          await supabase
            .from('duplicate_alerts')
            .insert({
              primary_property_id: primaryProperty.id,
              duplicate_property_id: upsertResult.id,
              price_difference: priceDiff,
              price_difference_percent: priceDiffPercent
            });
        }
      }
    }
    return { isNew: true };
  }
  
  return { isNew: false };
}

function parseHebrewDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const hebrewMonths: Record<string, number> = {
    'ינואר': 1, 'פברואר': 2, 'מרץ': 3, 'אפריל': 4,
    'מאי': 5, 'יוני': 6, 'יולי': 7, 'אוגוסט': 8,
    'ספטמבר': 9, 'אוקטובר': 10, 'נובמבר': 11, 'דצמבר': 12
  };
  
  const slashMatch = dateStr.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2,4})/);
  if (slashMatch) {
    const [_, day, month, year] = slashMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  for (const [heb, num] of Object.entries(hebrewMonths)) {
    if (dateStr.includes(heb)) {
      const yearMatch = dateStr.match(/\d{4}/);
      if (yearMatch) {
        return `${yearMatch[0]}-${String(num).padStart(2, '0')}-01`;
      }
    }
  }
  
  return null;
}

async function extractPropertiesWithAI(
  markdown: string,
  html: string,
  sourceUrl: string,
  propertyType: 'rent' | 'sale',
  apiKey: string,
  targetCities?: string[]
): Promise<ScrapedProperty[]> {
  const cityFilter = targetCities?.length 
    ? `\n\nIMPORTANT: Extract ONLY properties located in these cities: ${targetCities.join(', ')}.`
    : '';

  const systemPrompt = `You are a real estate data extraction expert. Extract RESIDENTIAL property listings ONLY from Homeless.

HOMELESS SPECIFIC INSTRUCTIONS:
- Each property shows: rooms (חד׳), floor, size in sqm (מ"ר), and price
- Look for property links and extract IDs from URLs
- Address typically includes street and city
- Extract source_id from the URL or listing identifier
- Look for entry/availability date in property details

CRITICAL FILTERING:
- Extract ONLY residential: apartments, penthouses, houses, garden apartments, studios
- IGNORE: offices, stores, commercial, parking, storage, pets, vehicles
${cityFilter}

Return a JSON array with: source_id, source_url, title, city, neighborhood, address, price (number), rooms (number), size (number), floor (number), entry_date, description, images, features.
Return ONLY valid JSON array. If no properties found, return [].`;

  const cleanedMarkdown = cleanMarkdownContent(markdown, 'homeless');

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract all property listings:\n\n${cleanedMarkdown.substring(0, 30000)}` }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('AI extraction error:', await response.text());
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const properties = JSON.parse(jsonMatch[0]);
    
    return properties
      .filter((p: any) => {
        if (targetCities?.length && p.city) {
          const normalizedPropCity = p.city.replace(/[-–—\s]/g, '');
          return targetCities.some(tc => normalizedPropCity.includes(tc.replace(/[-–—\s]/g, '')));
        }
        return true;
      })
      .map((p: any) => {
        const isBroker = detectBroker(p.title || '', p.description || '', p);
        let entryDate: string | null = null;
        let immediateEntry = false;
        
        if (p.entry_date) {
          const rawDate = (p.entry_date || '').toLowerCase();
          if (rawDate.includes('מיידי') || rawDate.includes('מידית')) {
            immediateEntry = true;
          } else {
            entryDate = parseHebrewDate(p.entry_date);
          }
        }
        
        return {
          source: 'homeless',
          source_url: p.source_url || sourceUrl,
          source_id: p.source_id || `homeless-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: p.title,
          city: p.city,
          neighborhood: p.neighborhood,
          address: p.address,
          price: p.price ? parseInt(p.price) : undefined,
          rooms: p.rooms ? parseFloat(p.rooms) : undefined,
          size: p.size ? parseInt(p.size) : undefined,
          floor: p.floor !== undefined ? parseInt(p.floor) : undefined,
          property_type: propertyType,
          description: p.description,
          images: p.images || [],
          features: {
            ...(p.features || {}),
            entry_date: entryDate,
            immediate_entry: immediateEntry
          },
          raw_data: p,
          is_private: !isBroker
        };
      });

  } catch (error) {
    console.error('AI extraction failed:', error);
    return [];
  }
}
