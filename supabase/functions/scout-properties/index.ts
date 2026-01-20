import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchScoutSettings } from "../_shared/settings.ts";
import { corsHeaders, userAgents, validateScrapedContent, scrapeWithRetry, cleanMarkdownContent } from "../_shared/scraping.ts";
import { ScoutConfig, buildSearchUrls, buildSinglePageUrl } from "../_shared/url-builders.ts";
import { detectBroker, normalizeCityName } from "../_shared/broker-detection.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch scout settings from database
  const settings = await fetchScoutSettings(supabase);
  const scrapingSettings = settings.scraping;
  console.log('Loaded scraping settings:', scrapingSettings);

  // Clean up stuck runs based on configured timeout
  const stuckTimeoutMs = scrapingSettings.stuck_timeout_minutes * 60 * 1000;
  const stuckTimeAgo = new Date(Date.now() - stuckTimeoutMs).toISOString();
  const { data: stuckRuns } = await supabase
    .from('scout_runs')
    .update({
      status: 'failed',
      error_message: `Timeout - scan took longer than ${scrapingSettings.stuck_timeout_minutes} minutes and was automatically stopped`,
      completed_at: new Date().toISOString()
    })
    .eq('status', 'running')
    .lt('started_at', stuckTimeAgo)
    .select('id, properties_found, source');
  
  if (stuckRuns?.length) {
    console.log(`Cleaned up ${stuckRuns.length} stuck runs:`, stuckRuns.map(r => `${r.id} (${r.source})`).join(', '));
  }

  let runId: string | undefined;
  let currentRunSource: string = 'manual';

  try {
    const { config_id, manual_url, source, page, retry_of, retry_strategy } = await req.json();

    currentRunSource = source || 'manual';
    
    if (retry_of) {
      console.log(`🔄 This is a retry of run ${retry_of}, strategy:`, retry_strategy);
    }

    let configs: ScoutConfig[] = [];

    if (manual_url) {
      const detectedSource = manual_url.includes('yad2') ? 'yad2' : 
                            manual_url.includes('madlan') ? 'madlan' :
                            manual_url.includes('homeless') ? 'homeless' : 'other';
      const detectedType = manual_url.includes('rent') || manual_url.includes('להשכרה') ? 'rent' : 'sale';
      
      configs = [{
        id: 'manual',
        name: 'Manual Scrape',
        source: detectedSource as any,
        property_type: detectedType,
        cities: [],
        neighborhoods: [],
        search_url: manual_url
      }];
    } else if (config_id) {
      const { data, error } = await supabase
        .from('scout_configs')
        .select('*')
        .eq('id', config_id)
        .single();
      
      if (error || !data) {
        throw new Error('Config not found');
      }
      configs = [data];
    } else {
      const { data, error } = await supabase
        .from('scout_configs')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      configs = data || [];
    }

    if (configs.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active configurations found',
        properties_found: 0,
        new_properties: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let totalPropertiesFound = 0;
    let totalNewProperties = 0;

    for (const config of configs) {
      console.log(`Processing config: ${config.name}${page !== undefined ? ` (page ${page} only)` : ''}`);

      currentRunSource = config.source || 'manual';
      const { data: runData, error: runError } = await supabase
        .from('scout_runs')
        .insert({
          config_id: config.id !== 'manual' ? config.id : null,
          source: currentRunSource,
          status: 'running',
          retry_of: retry_of || null,
          retry_count: retry_of ? 1 : 0
        })
        .select()
        .single();

      if (runError) {
        console.error('Failed to create run record:', runError);
      }
      runId = runData?.id;
      console.log(`Created run record: ${runId} for source: ${currentRunSource}`);

      // Build search URLs using shared utility
      const urls = page !== undefined 
        ? buildSinglePageUrl(config, page)
        : buildSearchUrls(config, scrapingSettings);

      const maxPropertiesPerConfig = scrapingSettings.max_properties_per_config;
      let configPropertiesFound = 0;
      let configNewProperties = 0;
      
      for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
        const url = urls[urlIndex];
        console.log(`Scraping URL ${urlIndex + 1}/${urls.length}: ${url}`);

        if (totalPropertiesFound >= maxPropertiesPerConfig) {
          console.log(`Reached max properties limit (${maxPropertiesPerConfig}), stopping scan for config: ${config.name}`);
          break;
        }

        // Add delay between requests
        if (urlIndex > 0) {
          const isMadlan = url.includes('madlan');
          const delay = isMadlan 
            ? scrapingSettings.madlan_delay_ms + Math.random() * 3000
            : scrapingSettings.delay_between_requests_ms + Math.random() * 500;
          console.log(`Waiting ${Math.round(delay)}ms before next request (${isMadlan ? 'Madlan - slower' : 'standard'})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
          if (!firecrawlApiKey) {
            console.warn('FIRECRAWL_API_KEY not configured');
            continue;
          }

          const currentSource = url.includes('madlan') ? 'madlan' : 
                               url.includes('yad2') ? 'yad2' : 
                               url.includes('homeless') ? 'homeless' : 'other';

          const scrapeData = await scrapeWithRetry(url, firecrawlApiKey, currentSource);
          
          if (!scrapeData) {
            console.error(`All retry attempts failed for ${url}, continuing to next URL`);
            continue;
          }

          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          const html = scrapeData.data?.html || scrapeData.html || '';

          const validation = validateScrapedContent(markdown, html, currentSource);
          if (!validation.valid) {
            console.error(`Content validation failed for ${url}: ${validation.reason}`);
            
            if (runId) {
              await supabase
                .from('scout_runs')
                .update({
                  status: 'partial',
                  error_message: validation.reason
                })
                .eq('id', runId);
            }
            continue;
          }

          if (!lovableApiKey) {
            console.warn('LOVABLE_API_KEY not configured');
            continue;
          }

          const extractedProperties = await extractPropertiesWithAI(
            markdown, 
            html, 
            url,
            config.property_type === 'both' ? 'rent' : config.property_type,
            lovableApiKey,
            config.cities
          );

          console.log(`Extracted ${extractedProperties.length} properties from ${url}`);
          
          // Enhanced logging for Madlan debugging when no properties found
          if (extractedProperties.length === 0) {
            const sourceFromUrl = url.includes('madlan') ? 'Madlan' : url.includes('homeless') ? 'Homeless' : 'Unknown';
            console.warn(`⚠️ ${sourceFromUrl}: 0 properties extracted from ${url}`);
            console.warn(`   Markdown length: ${markdown?.length || 0} chars`);
            console.warn(`   HTML length: ${html?.length || 0} chars`);
            console.warn(`   Markdown preview (first 800 chars): ${(markdown || '').substring(0, 800)}`);
            
            // Check for common blocking indicators
            const lowerMarkdown = (markdown || '').toLowerCase();
            if (lowerMarkdown.includes('captcha') || lowerMarkdown.includes('access denied') || lowerMarkdown.includes('blocked')) {
              console.error(`🚫 ${sourceFromUrl}: Possible anti-bot blocking detected!`);
            }
          }

          // Save properties immediately after each page
          for (const property of extractedProperties) {
            const normalizedCity = normalizeCityName(property.city);
            
            // Check for duplicates
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
                
                console.log(`🔄 Found duplicate: ${property.address} (${property.source}) matches ${primaryDuplicate.source}`);
                
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
            
            // Use upsert with ON CONFLICT to handle race conditions atomically
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

            // Only count as new if we actually inserted
            if (!upsertError && upsertResult) {
              totalNewProperties++;
              configNewProperties++;
              
              // Create duplicate alert if price difference > 5%
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
                    console.log(`📢 Created price alert: ${priceDiff} (${priceDiffPercent.toFixed(1)}%)`);
                  }
                }
              }
            } else if (upsertError && !upsertError.message?.includes('duplicate')) {
              console.error('Upsert error:', upsertError);
            }
          }
          
          totalPropertiesFound += extractedProperties.length;
          configPropertiesFound += extractedProperties.length;
          console.log(`Saved ${extractedProperties.length} properties. Config total: ${configPropertiesFound} found, ${configNewProperties} new`);

          // Update scout_runs incrementally
          if (runId) {
            await supabase
              .from('scout_runs')
              .update({
                properties_found: configPropertiesFound,
                new_properties: configNewProperties
              })
              .eq('id', runId);
          }

        } catch (scrapeError) {
          console.error(`Error processing ${url}:`, scrapeError);
          continue;
        }
      }

      // Complete this config's run record
      if (runId) {
        await supabase
          .from('scout_runs')
          .update({
            status: 'completed',
            properties_found: configPropertiesFound,
            new_properties: configNewProperties,
            completed_at: new Date().toISOString()
          })
          .eq('id', runId);
        console.log(`Completed run ${runId}: ${configPropertiesFound} found, ${configNewProperties} new`);
      }

      // Update config last run
      if (config.id !== 'manual') {
        await supabase
          .from('scout_configs')
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: 'completed',
            last_run_results: { properties_found: configPropertiesFound }
          })
          .eq('id', config.id);
      }
    }

    // Trigger lead matching if new properties were found
    if (totalNewProperties > 0) {
      console.log(`Triggering lead matching for ${totalNewProperties} new properties with run_id: ${runId}...`);
      fetch(`${supabaseUrl}/functions/v1/match-scouted-to-leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          send_whatsapp: false
          // Don't pass run_id - matching creates its own separate run with source='matching'
        }),
      }).catch(err => {
        console.error('Failed to trigger lead matching:', err);
      });
    }

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      properties_found: totalPropertiesFound,
      new_properties: totalNewProperties
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scout error:', error);
    
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
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// AI extraction function - kept here as it's specific to scout-properties
async function extractPropertiesWithAI(
  markdown: string,
  html: string,
  sourceUrl: string,
  propertyType: 'rent' | 'sale',
  apiKey: string,
  targetCities?: string[]
): Promise<ScrapedProperty[]> {
  const source = sourceUrl.includes('yad2') ? 'yad2' : 
                 sourceUrl.includes('madlan') ? 'madlan' :
                 sourceUrl.includes('homeless') ? 'homeless' : 'other';

  const cityFilter = targetCities?.length 
    ? `\n\nIMPORTANT: Extract ONLY properties located in these cities: ${targetCities.join(', ')}. 
Ignore any "recommended", "similar", or "you might also like" listings from OTHER cities.`
    : '';

  const sourceSpecificInstructions = source === 'madlan' 
    ? `

MADLAN SPECIFIC INSTRUCTIONS:
- Each property card contains: price in ₪ format (e.g., ‏5,300 ‏₪), rooms (חד׳), floor (קומה), size in sqm (מ"ר)
- Address format: "דירה, [street], [neighborhood]" or "פנטהאוז, [street], [neighborhood]"
- Look for property links containing: /listings/ followed by the listing ID
- Extract source_id from URL patterns like: https://www.madlan.co.il/listings/[ID]
- Ignore navigation, filters, and "דירות נוספות" recommendation sections
- Focus on the main property list, not featured or sponsored listings
- Extract at least 10-15 properties if available on the page`
    : source === 'homeless'
    ? `

HOMELESS SPECIFIC INSTRUCTIONS:
- Each property shows: rooms (חד׳), floor, size in sqm (מ"ר), and price
- Look for property links and extract IDs from URLs
- Address typically includes street and city
- Extract source_id from the URL or listing identifier`
    : `

YAD2 SPECIFIC INSTRUCTIONS:
- Each property card has: price, rooms, size, floor, and address
- Look for item IDs in the listings (usually numeric)
- Extract source_id from data attributes or URL patterns`;

  const systemPrompt = `You are a real estate data extraction expert. Extract RESIDENTIAL property listings ONLY.

CRITICAL FILTERING RULES:
- Extract ONLY residential properties: apartments (דירה), penthouses (פנטהאוז), mini-penthouses (מיני פנטהאוז), private houses (בית פרטי), garden apartments (דירת גן), studios (סטודיו)
- IGNORE completely: offices (משרדים), stores (חנויות), commercial spaces, parking spots, storage units
- IGNORE completely: pet listings (כלבים, חתולים), vehicle listings, general classifieds
- IGNORE completely: projects under construction unless specifically residential apartments

Return a JSON array of properties with these fields:
- source_id: unique ID from the listing (look for item IDs, listing numbers)
- source_url: full URL to the listing if available, otherwise use "${sourceUrl}"
- title: listing title
- city: city name in Hebrew
- neighborhood: neighborhood name in Hebrew
- address: street address if available
- price: price as number (remove currency symbols, commas)
- rooms: number of rooms (can be decimal like 3.5)
- size: size in sqm as number
- floor: floor number
- description: short description
- images: array of image URLs if found
- features: object with boolean keys like {parking: true, elevator: true, balcony: true, mamad: true}
${sourceSpecificInstructions}
${cityFilter}
Return ONLY valid JSON array. If no properties found, return [].`;

  const cleanedMarkdown = cleanMarkdownContent(markdown, source);

  const userPrompt = `Extract all property listings from this ${source} page content.
Focus on the main property list and extract at least 10 properties if available.

${cleanedMarkdown.substring(0, 30000)}`;

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
          { role: 'user', content: userPrompt }
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
    if (!jsonMatch) {
      console.warn('No JSON array found in AI response');
      return [];
    }

    const properties = JSON.parse(jsonMatch[0]);
    
    // Helper to normalize city names for comparison
    const normalizeCity = (city: string): string => {
      if (!city) return '';
      return city.trim()
        .replace(/[-–—\s]+/g, '')
        .replace(/יפו/g, '')
        .replace(/ישראל/g, '');
    };

    // Filter by target cities if specified
    let filteredProperties = properties;
    if (targetCities?.length) {
      const normalizedTargets = targetCities.map(normalizeCity);
      
      filteredProperties = properties.filter((p: any) => {
        if (!p.city) return false;
        const normalizedPropCity = normalizeCity(p.city);
        
        return normalizedTargets.some(target => 
          normalizedPropCity === target || 
          (target.length >= 4 && normalizedPropCity.includes(target))
        );
      });
      console.log(`City filter: ${properties.length} -> ${filteredProperties.length} properties for cities: ${targetCities.join(', ')}`);
    }

    // Filter out non-residential properties
    const invalidKeywords = [
      'כלב', 'חתול', 'כלבים', 'חתולים',
      'משרד', 'משרדים', 'חנות', 'חנויות', 
      'מסחרי', 'מסחרית', 'עסק', 'עסקים',
      'קליניקה', 'מרפאה', 'מספרה', 'בית קפה',
      'חניה', 'חניון', 'מחסן', 'מחסנים',
      'מפעל', 'מחסן לוגיסטי', 'אולם'
    ];
    filteredProperties = filteredProperties.filter((p: any) => {
      const title = (p.title || '').toLowerCase();
      const description = (p.description || '').toLowerCase();
      const combined = title + ' ' + description;
      
      if (invalidKeywords.some(kw => combined.includes(kw))) {
        console.log(`Filtered out non-residential: ${p.title}`);
        return false;
      }
      
      if (propertyType === 'rent') {
        if (title.includes('למכירה') && !title.includes('להשכרה')) {
          console.log(`Filtered out mismatched property type (sale in rent scrape): ${p.title}`);
          return false;
        }
      } else if (propertyType === 'sale') {
        if (title.includes('להשכרה') && !title.includes('למכירה')) {
          console.log(`Filtered out mismatched property type (rent in sale scrape): ${p.title}`);
          return false;
        }
      }
      
      return true;
    });
    console.log(`Property type filter: ${properties.length} -> ${filteredProperties.length} residential properties`);

    return filteredProperties.map((p: any) => {
      const isBroker = detectBroker(p.title || '', p.description || '', p);
      
      return {
        source,
        source_url: p.source_url || sourceUrl,
        source_id: p.source_id || `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        features: p.features || {},
        raw_data: p,
        is_private: !isBroker
      };
    });

  } catch (error) {
    console.error('AI extraction failed:', error);
    return [];
  }
}
