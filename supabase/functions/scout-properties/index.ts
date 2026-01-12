import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoutConfig {
  id: string;
  name: string;
  source: 'yad2' | 'yad2_private' | 'madlan' | 'homeless' | 'both' | 'all';
  property_type: 'rent' | 'sale' | 'both';
  cities: string[];
  neighborhoods: string[];
  min_price?: number;
  max_price?: number;
  min_rooms?: number;
  max_rooms?: number;
  search_url?: string;
}

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

  try {
    const { config_id, manual_url, source } = await req.json();

    // Create a run record
    const { data: runData, error: runError } = await supabase
      .from('scout_runs')
      .insert({
        config_id: config_id || null,
        source: source || 'manual',
        status: 'running'
      })
      .select()
      .single();

    if (runError) {
      console.error('Failed to create run record:', runError);
    }

    const runId = runData?.id;

    let configs: ScoutConfig[] = [];

    if (manual_url) {
      // Manual URL scraping
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
      // Specific config
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
      // Get all active configs
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
    const allProperties: ScrapedProperty[] = [];

    for (const config of configs) {
      console.log(`Processing config: ${config.name}`);

      // Build search URLs
      const urls = buildSearchUrls(config);

      for (const url of urls) {
        console.log(`Scraping URL: ${url}`);

        try {
          // Use Firecrawl to scrape
          if (!firecrawlApiKey) {
            console.warn('FIRECRAWL_API_KEY not configured');
            continue;
          }

          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              formats: ['markdown', 'html'],
              onlyMainContent: true,
              waitFor: 3000, // Wait for dynamic content
            }),
          });

          if (!scrapeResponse.ok) {
            console.error(`Firecrawl error for ${url}:`, await scrapeResponse.text());
            continue;
          }

          const scrapeData = await scrapeResponse.json();
          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          const html = scrapeData.data?.html || scrapeData.html || '';

          // Use AI to extract property data
          if (!lovableApiKey) {
            console.warn('LOVABLE_API_KEY not configured');
            continue;
          }

          const extractedProperties = await extractPropertiesWithAI(
            markdown, 
            html, 
            url,
            config.property_type === 'both' ? 'rent' : config.property_type,
            lovableApiKey
          );

          console.log(`Extracted ${extractedProperties.length} properties from ${url}`);
          allProperties.push(...extractedProperties);
          totalPropertiesFound += extractedProperties.length;

        } catch (scrapeError) {
          console.error(`Error scraping ${url}:`, scrapeError);
        }
      }

      // Update config last run
      if (config.id !== 'manual') {
        await supabase
          .from('scout_configs')
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: 'completed',
            last_run_results: { properties_found: allProperties.length }
          })
          .eq('id', config.id);
      }
    }

    // Save new properties to database
    for (const property of allProperties) {
      const { data: existing } = await supabase
        .from('scouted_properties')
        .select('id')
        .eq('source', property.source)
        .eq('source_id', property.source_id)
        .maybeSingle();

      if (existing) {
        // Update last_seen_at for existing property
        await supabase
          .from('scouted_properties')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        // Insert new property
        const { error: insertError } = await supabase
          .from('scouted_properties')
          .insert({
            source: property.source,
            source_url: property.source_url,
            source_id: property.source_id,
            title: property.title,
            city: property.city,
            neighborhood: property.neighborhood,
            address: property.address,
            price: property.price,
            rooms: property.rooms,
            size: property.size,
            floor: property.floor,
            property_type: property.property_type,
            description: property.description,
            images: property.images || [],
            features: property.features || {},
            raw_data: property.raw_data,
            status: 'new'
          });

        if (!insertError) {
          totalNewProperties++;
        } else {
          console.error('Insert error:', insertError);
        }
      }
    }

    // Update run record
    if (runId) {
      await supabase
        .from('scout_runs')
        .update({
          status: 'completed',
          properties_found: totalPropertiesFound,
          new_properties: totalNewProperties,
          completed_at: new Date().toISOString()
        })
        .eq('id', runId);
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
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildSearchUrls(config: ScoutConfig): string[] {
  const urls: string[] = [];

  // If custom URL provided, use it
  if (config.search_url) {
    return [config.search_url];
  }

  // Determine which sources to scan
  let sources: string[] = [];
  if (config.source === 'both') {
    sources = ['madlan', 'yad2_private']; // Madlan + Yad2 private
  } else if (config.source === 'all') {
    sources = ['madlan', 'madlan_projects', 'yad2_private', 'yad2', 'homeless']; // All sources including new projects
  } else {
    sources = [config.source];
  }

  const types = config.property_type === 'both' ? ['rent', 'sale'] : [config.property_type];

  for (const source of sources) {
    for (const type of types) {
      if (source === 'yad2' || source === 'yad2_private') {
        // Yad2 city codes mapping (topArea, area, city)
        const yad2CityMap: Record<string, { topArea: string; area: string; city: string }> = {
          'תל אביב': { topArea: '2', area: '1', city: '5000' },
          'תל אביב יפו': { topArea: '2', area: '1', city: '5000' },
          'ירושלים': { topArea: '1', area: '1', city: '3000' },
          'חיפה': { topArea: '3', area: '1', city: '4000' },
          'ראשון לציון': { topArea: '2', area: '2', city: '8300' },
          'פתח תקווה': { topArea: '2', area: '3', city: '7900' },
          'אשדוד': { topArea: '2', area: '12', city: '70' },
          'נתניה': { topArea: '4', area: '1', city: '7400' },
          'באר שבע': { topArea: '5', area: '1', city: '9000' },
          'חולון': { topArea: '2', area: '1', city: '6600' },
          'בת ים': { topArea: '2', area: '1', city: '6200' },
          'רמת גן': { topArea: '2', area: '1', city: '8600' },
          'הרצליה': { topArea: '2', area: '4', city: '6400' },
          'רעננה': { topArea: '4', area: '2', city: '8700' },
          'גבעתיים': { topArea: '2', area: '1', city: '2650' },
          'כפר סבא': { topArea: '4', area: '2', city: '6900' },
          'הוד השרון': { topArea: '4', area: '2', city: '6500' },
          'רמת השרון': { topArea: '2', area: '4', city: '8800' },
        };

        // Build Yad2 URL with numeric codes
        let url = `https://www.yad2.co.il/realestate/${type === 'rent' ? 'rent' : 'forsale'}`;
        const params = new URLSearchParams();
        
        if (config.cities?.length) {
          const cityData = yad2CityMap[config.cities[0]];
          if (cityData) {
            params.set('topArea', cityData.topArea);
            params.set('area', cityData.area);
            params.set('city', cityData.city);
          }
        }
        
        // Add private owner filter for yad2_private
        if (source === 'yad2_private') {
          params.set('propertyGroup', 'apartments');
          params.set('dealerType', '1'); // Private owners only
        }
        
        if (config.min_price) params.set('price', `${config.min_price}-${config.max_price || ''}`);
        if (config.min_rooms) params.set('rooms', `${config.min_rooms}-${config.max_rooms || ''}`);
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
        console.log(`Built Yad2 URL: ${url}`);
        urls.push(url);
        
      } else if (source === 'madlan' || source === 'madlan_projects') {
        // Madlan city mapping - Hebrew name to URL format (with -ישראל suffix)
        const madlanCityMap: Record<string, string> = {
          'תל אביב': 'תל-אביב-יפו-ישראל',
          'תל אביב יפו': 'תל-אביב-יפו-ישראל',
          'ירושלים': 'ירושלים-ישראל',
          'חיפה': 'חיפה-ישראל',
          'ראשון לציון': 'ראשון-לציון-ישראל',
          'פתח תקווה': 'פתח-תקווה-ישראל',
          'אשדוד': 'אשדוד-ישראל',
          'נתניה': 'נתניה-ישראל',
          'באר שבע': 'באר-שבע-ישראל',
          'חולון': 'חולון-ישראל',
          'בת ים': 'בת-ים-ישראל',
          'רמת גן': 'רמת-גן-ישראל',
          'הרצליה': 'הרצליה-ישראל',
          'רעננה': 'רעננה-ישראל',
          'גבעתיים': 'גבעתיים-ישראל',
          'כפר סבא': 'כפר-סבא-ישראל',
          'הוד השרון': 'הוד-השרון-ישראל',
          'רמת השרון': 'רמת-השרון-ישראל',
        };

        // Build correct path based on source type
        let pathType: string;
        if (source === 'madlan_projects') {
          pathType = 'projects-for-sale';
        } else {
          pathType = type === 'rent' ? 'for-rent' : 'for-sale';
        }
        
        let url = `https://www.madlan.co.il/${pathType}`;
        
        if (config.cities?.length) {
          const hebrewCity = config.cities[0];
          const citySlug = madlanCityMap[hebrewCity] || hebrewCity.replace(/\s+/g, '-') + '-ישראל';
          url += `/${citySlug}`;
        }
        console.log(`Built Madlan URL: ${url}`);
        urls.push(url);
        
      } else if (source === 'homeless') {
        // Build Homeless URL
        let url = `https://www.homeless.co.il/${type === 'rent' ? 'rent' : 'sale'}`;
        
        if (config.cities?.length) {
          // Homeless uses query params for location
          const params = new URLSearchParams();
          params.set('location', config.cities[0]);
          url += '?' + params.toString();
        }
        urls.push(url);
      }
    }
  }

  return urls;
}

async function extractPropertiesWithAI(
  markdown: string,
  html: string,
  sourceUrl: string,
  propertyType: 'rent' | 'sale',
  apiKey: string
): Promise<ScrapedProperty[]> {
  const source = sourceUrl.includes('yad2') ? 'yad2' : 
                 sourceUrl.includes('madlan') ? 'madlan' :
                 sourceUrl.includes('homeless') ? 'homeless' : 'other';

  const systemPrompt = `You are a real estate data extraction expert. Extract property listings from the provided content.
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

Return ONLY valid JSON array. If no properties found, return [].`;

  const userPrompt = `Extract all property listings from this ${source} page content:

${markdown.substring(0, 15000)}`;

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
    
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('No JSON array found in AI response');
      return [];
    }

    const properties = JSON.parse(jsonMatch[0]);
    
    return properties.map((p: any) => ({
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
      raw_data: p
    }));

  } catch (error) {
    console.error('AI extraction failed:', error);
    return [];
  }
}
