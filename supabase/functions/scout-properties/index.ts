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
  is_private?: boolean | null;
}

// User agents for retry mechanism
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

// Scrape with retry mechanism using different user agents
async function scrapeWithRetry(url: string, firecrawlApiKey: string, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

      console.log(`Scrape attempt ${attempt + 1}/${maxRetries} for ${url}`);

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          waitFor: 3000, // 3 seconds for dynamic content
          headers: {
            'User-Agent': userAgents[attempt % userAgents.length],
            'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
          }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`Scrape successful for ${url}`);
        return data;
      }

      const errorText = await response.text();
      console.warn(`Attempt ${attempt + 1} failed for ${url}, status: ${response.status}, error: ${errorText}`);

      // Wait before retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const waitTime = 3000 * (attempt + 1);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(r => setTimeout(r, waitTime));
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`Attempt ${attempt + 1} timeout for ${url}`);
      } else {
        console.error(`Attempt ${attempt + 1} error for ${url}:`, error);
      }
      
      if (attempt < maxRetries - 1) {
        const waitTime = 3000 * (attempt + 1);
        await new Promise(r => setTimeout(r, waitTime));
      }
    }
  }

  console.error(`All ${maxRetries} retry attempts failed for ${url}`);
  return null;
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

  // Clean up stuck runs older than 1 hour at the start of each execution
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: stuckRuns } = await supabase
    .from('scout_runs')
    .update({
      status: 'failed',
      error_message: 'Timeout - automatically cleaned',
      completed_at: new Date().toISOString()
    })
    .eq('status', 'running')
    .lt('started_at', oneHourAgo)
    .select('id');
  
  if (stuckRuns?.length) {
    console.log(`Cleaned up ${stuckRuns.length} stuck runs`);
  }

  let runId: string | undefined;

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

    runId = runData?.id;

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
    // allProperties array removed - saving immediately after each page now

    for (const config of configs) {
      console.log(`Processing config: ${config.name}`);

      // Build search URLs
      const urls = buildSearchUrls(config);

      const maxPropertiesPerConfig = 500; // Increased from 100 to handle more pages
      
      for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
        const url = urls[urlIndex];
        console.log(`Scraping URL ${urlIndex + 1}/${urls.length}: ${url}`);

        // Check if we've reached max properties for this config
        if (totalPropertiesFound >= maxPropertiesPerConfig) {
          console.log(`Reached max properties limit (${maxPropertiesPerConfig}), stopping scan for config: ${config.name}`);
          break;
        }

        // Add delay between requests to avoid rate limiting (skip first request)
        if (urlIndex > 0) {
          const delay = 1000 + Math.random() * 500; // 1-1.5 seconds random delay
          console.log(`Waiting ${Math.round(delay)}ms before next request...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
          // Use Firecrawl with retry mechanism
          if (!firecrawlApiKey) {
            console.warn('FIRECRAWL_API_KEY not configured');
            continue;
          }

          const scrapeData = await scrapeWithRetry(url, firecrawlApiKey);
          
          if (!scrapeData) {
            console.error(`All retry attempts failed for ${url}, continuing to next URL`);
            continue;
          }

          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          const html = scrapeData.data?.html || scrapeData.html || '';

          // Use AI to extract property data
          if (!lovableApiKey) {
            console.warn('LOVABLE_API_KEY not configured');
            continue;
          }

          // Extract properties - is_private will be detected from content
          const extractedProperties = await extractPropertiesWithAI(
            markdown, 
            html, 
            url,
            config.property_type === 'both' ? 'rent' : config.property_type,
            lovableApiKey,
            config.cities
          );

          console.log(`Extracted ${extractedProperties.length} properties from ${url}`);
          
          // SAVE IMMEDIATELY after each page - prevent data loss on timeout
          for (const property of extractedProperties) {
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
              // Normalize city name before saving
              const normalizedCity = normalizeCityName(property.city);
              
              // Insert new property with is_private field
              const { error: insertError } = await supabase
                .from('scouted_properties')
                .insert({
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
                  property_type: property.property_type,
                  description: property.description,
                  images: property.images || [],
                  features: property.features || {},
                  raw_data: property.raw_data,
                  status: 'new',
                  is_private: property.is_private
                });

              if (!insertError) {
                totalNewProperties++;
              } else {
                console.error('Insert error:', insertError);
              }
            }
          }
          
          totalPropertiesFound += extractedProperties.length;
          console.log(`Saved ${extractedProperties.length} properties. Total so far: ${totalPropertiesFound} found, ${totalNewProperties} new`);

        } catch (scrapeError) {
          console.error(`Error processing ${url}:`, scrapeError);
          continue;
        }
      }

      // Update config last run
      if (config.id !== 'manual') {
        await supabase
          .from('scout_configs')
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: 'completed',
            last_run_results: { properties_found: totalPropertiesFound }
          })
          .eq('id', config.id);
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
    
    // Update run record to failed status if we have a runId
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

// Normalize city names for consistent storage
function normalizeCityName(city: string | undefined): string | undefined {
  if (!city) return city;
  
  const cityLower = city.trim();
  
  // Normalize Tel Aviv variations to standard format
  if (cityLower.includes('תל אביב') || cityLower.includes('תל-אביב')) {
    return 'תל אביב יפו';
  }
  
  return city.trim();
}

// Detect broker from title/description keywords
function detectBroker(title: string, description: string): boolean {
  const brokerKeywords = [
    'תיווך', 'נדל"ן', 'נדלן', 'סוכנות', 'משרד',
    'רימקס', 'אנגלו סכסון', 're/max', 'remax', 'century 21', 'century21',
    'קולדוול בנקר', 'coldwell', 'מתווך', 'agency', 'real estate',
    'נכסים', 'ריאלטי', 'realty', 'קבוצת', 'group', 'אחוזות'
  ];
  
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  return brokerKeywords.some(keyword => text.includes(keyword.toLowerCase()));
}

function buildSearchUrls(config: ScoutConfig): string[] {
  const urls: string[] = [];
  const pagesToScan = 7; // ~140 properties per source+type (7 pages x ~20 per page)

  // If custom URL provided, use it (no pagination for manual URLs)
  if (config.search_url) {
    return [config.search_url];
  }

  // Determine which sources to scan
  // homeless is temporarily disabled, yad2/yad2_private merged into single yad2
  let sources: string[] = [];
  if (config.source === 'yad2' || config.source === 'yad2_private') {
    sources = ['yad2']; // Single scan for all Yad2 (private + broker)
  } else if (config.source === 'both') {
    sources = ['madlan', 'yad2']; // Madlan + Yad2
  } else if (config.source === 'all') {
    sources = ['madlan', 'yad2']; // Without homeless for now
  } else if (config.source === 'homeless') {
    sources = []; // Temporarily disabled
    console.log('Homeless source is temporarily disabled');
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
        
        params.set('propertyGroup', 'apartments');
        
        // No dealerType filter - scan ALL listings (private + broker)
        // is_private will be detected from content keywords
        
        if (config.min_price) params.set('price', `${config.min_price}-${config.max_price || ''}`);
        if (config.min_rooms) params.set('rooms', `${config.min_rooms}-${config.max_rooms || ''}`);
        
        // Add pagination for Yad2 - uses page parameter
        for (let page = 1; page <= pagesToScan; page++) {
          const pageParams = new URLSearchParams(params);
          if (page > 1) {
            pageParams.set('page', page.toString());
          }
          const pageUrl = url + '?' + pageParams.toString();
          console.log(`Built Yad2 URL (page ${page}): ${pageUrl}`);
          urls.push(pageUrl);
        }
        
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
        
        let baseUrl = `https://www.madlan.co.il/${pathType}`;
        
        if (config.cities?.length) {
          const hebrewCity = config.cities[0];
          const citySlug = madlanCityMap[hebrewCity] || hebrewCity.replace(/\s+/g, '-') + '-ישראל';
          baseUrl += `/${citySlug}`;
        }
        
        // Add pagination - Madlan uses ?page=X
        for (let page = 1; page <= pagesToScan; page++) {
          const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
          console.log(`Built Madlan URL (page ${page}): ${url}`);
          urls.push(url);
        }
        
      } else if (source === 'homeless') {
        // Homeless city codes mapping (for rent - uses inumber1 format)
        // Format: inumber1=topArea,area,city
        const homelessCityMap: Record<string, { code: string }> = {
          'תל אביב': { code: '17,1,150' },
          'תל אביב יפו': { code: '17,1,150' },
          'ירושלים': { code: '1,1,3000' },
          'חיפה': { code: '4,1,4000' },
          'ראשון לציון': { code: '17,2,8300' },
          'פתח תקווה': { code: '17,3,7900' },
          'אשדוד': { code: '17,12,70' },
          'נתניה': { code: '11,1,7400' },
          'באר שבע': { code: '6,1,9000' },
          'חולון': { code: '17,1,6600' },
          'בת ים': { code: '17,1,6200' },
          'רמת גן': { code: '17,1,8600' },
          'הרצליה': { code: '17,4,6400' },
          'רעננה': { code: '11,2,8700' },
        };

        // Build Homeless URL - different format for rent vs sale
        let baseUrl: string;
        
        if (type === 'rent') {
          // Rent uses: /rent/inumber1=17,1,150
          baseUrl = 'https://www.homeless.co.il/rent/';
          if (config.cities?.length) {
            const cityData = homelessCityMap[config.cities[0]];
            if (cityData) {
              baseUrl += `inumber1=${cityData.code}`;
            }
          }
        } else {
          // Sale uses: /sale/city=תל אביב (URL encoded)
          baseUrl = 'https://www.homeless.co.il/sale/';
          if (config.cities?.length) {
            baseUrl += `city=${encodeURIComponent(config.cities[0])}`;
          }
        }
        
        // Add pagination - Homeless uses /page/X or ?page=X
        for (let page = 1; page <= pagesToScan; page++) {
          const separator = baseUrl.includes('?') ? '&' : (baseUrl.endsWith('/') ? '' : '/');
          const url = page === 1 ? baseUrl : `${baseUrl}${separator}page/${page}`;
          console.log(`Built Homeless URL (page ${page}): ${url}`);
          urls.push(url);
        }
      }
    }
  }

  return urls;
}

// Clean markdown content to remove navigation and focus on property listings
function cleanMarkdownContent(markdown: string, source: string): string {
  if (source === 'madlan') {
    // Look for patterns that indicate property listings start
    const listingPatterns = [
      /דירות להשכרה בתל[-\s]?אביב/,
      /דירות למכירה בתל[-\s]?אביב/,
      /דירות להשכרה/,
      /דירות למכירה/,
      /נמצאו \d+ דירות/,
      /\d+ דירות נמצאו/,
      /₪.*חד[׳']/,  // Price followed by rooms indicator
    ];
    
    for (const pattern of listingPatterns) {
      const match = markdown.search(pattern);
      if (match > 0) {
        // Start from a bit before the match to include context
        return markdown.substring(Math.max(0, match - 100));
      }
    }
  }
  
  if (source === 'homeless') {
    // For homeless, look for property listing indicators
    const listingPatterns = [
      /דירות להשכרה/,
      /דירות למכירה/,
      /\d+ ח[׳'].*\d+ מ"ר/,  // Rooms and size pattern
    ];
    
    for (const pattern of listingPatterns) {
      const match = markdown.search(pattern);
      if (match > 0) {
        return markdown.substring(Math.max(0, match - 100));
      }
    }
  }
  
  return markdown;
}

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

  // Source-specific parsing instructions
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
    : (source === 'yad2' || source === 'yad2_private')
    ? `

YAD2 SPECIFIC INSTRUCTIONS:
- Each property card has: price, rooms, size, floor, and address
- Look for item IDs in the listings (usually numeric)
- Extract source_id from data attributes or URL patterns`
    : '';

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

  // Clean the markdown to remove navigation and focus on listings
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
    
    // Try to parse JSON from the response
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
        .replace(/[-–—\s]+/g, '') // Remove dashes and spaces
        .replace(/יפו/g, '')       // Remove "יפו" suffix
        .replace(/ישראל/g, '');   // Remove "ישראל" suffix
    };

    // Filter by target cities if specified (strict filter)
    let filteredProperties = properties;
    if (targetCities?.length) {
      const normalizedTargets = targetCities.map(normalizeCity);
      
      filteredProperties = properties.filter((p: any) => {
        if (!p.city) return false;
        const normalizedPropCity = normalizeCity(p.city);
        
        // Check for exact match or strong partial match (target must be >= 4 chars)
        return normalizedTargets.some(target => 
          normalizedPropCity === target || 
          (target.length >= 4 && normalizedPropCity.includes(target))
        );
      });
      console.log(`City filter: ${properties.length} -> ${filteredProperties.length} properties for cities: ${targetCities.join(', ')}`);
    }

    // Filter out non-residential properties
    const invalidKeywords = [
      // בעלי חיים
      'כלב', 'חתול', 'כלבים', 'חתולים',
      // מסחרי
      'משרד', 'משרדים', 'חנות', 'חנויות', 
      'מסחרי', 'מסחרית', 'עסק', 'עסקים',
      // שירותים
      'קליניקה', 'מרפאה', 'מספרה', 'בית קפה',
      // אחסון/חניה
      'חניה', 'חניון', 'מחסן', 'מחסנים',
      // תעשייה
      'מפעל', 'מחסן לוגיסטי', 'אולם'
    ];
    filteredProperties = filteredProperties.filter((p: any) => {
      const title = (p.title || '').toLowerCase();
      const description = (p.description || '').toLowerCase();
      const combined = title + ' ' + description;
      
      // Reject if contains invalid keywords
      if (invalidKeywords.some(kw => combined.includes(kw))) {
        console.log(`Filtered out non-residential: ${p.title}`);
        return false;
      }
      
      // Check for title/property_type mismatch
      if (propertyType === 'rent') {
        // If scraping rent but title says "למכירה" without "להשכרה" - likely wrong listing
        if (title.includes('למכירה') && !title.includes('להשכרה')) {
          console.log(`Filtered out mismatched property type (sale in rent scrape): ${p.title}`);
          return false;
        }
      } else if (propertyType === 'sale') {
        // If scraping sale but title says "להשכרה" without "למכירה" - likely wrong listing
        if (title.includes('להשכרה') && !title.includes('למכירה')) {
          console.log(`Filtered out mismatched property type (rent in sale scrape): ${p.title}`);
          return false;
        }
      }
      
      return true;
    });
    console.log(`Property type filter: ${properties.length} -> ${filteredProperties.length} residential properties`);

    return filteredProperties.map((p: any) => {
      // Detect if this is a broker listing based on content keywords
      const isBroker = detectBroker(p.title || '', p.description || '');
      
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
        is_private: !isBroker // true = private (no broker keywords), false = broker
      };
    });

  } catch (error) {
    console.error('AI extraction failed:', error);
    return [];
  }
}
