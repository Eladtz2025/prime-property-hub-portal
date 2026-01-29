import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyData {
  rooms?: number;
  price?: number;
  size?: number;
  city?: string;
  floor?: number;
  neighborhood?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { limit = 20, dry_run = false } = await req.json().catch(() => ({}));

    console.log(`🔄 Backfill started (limit: ${limit}, dry_run: ${dry_run})`);

    // Get properties with missing data that have a valid source_url
    const { data: properties, error } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, rooms, price, size, city, floor, neighborhood, address, title')
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .or('rooms.is.null,price.is.null,size.is.null')
      .limit(limit);

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    console.log(`📋 Found ${properties?.length || 0} properties with missing data`);

    const results = {
      processed: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{ id: string; status: string; extracted?: PropertyData; error?: string }>
    };

    for (const prop of properties || []) {
      try {
        // Skip invalid URLs
        if (!prop.source_url || 
            prop.source_url === 'https://www.homeless.co.il' ||
            !prop.source_url.includes('http')) {
          results.skipped++;
          results.details.push({ id: prop.id, status: 'skipped', error: 'Invalid URL' });
          continue;
        }

        console.log(`\n🔍 Processing: ${prop.source_url}`);
        results.processed++;

        // Scrape the page
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: prop.source_url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          const errorText = await scrapeResponse.text();
          console.log(`❌ Scrape failed: ${errorText}`);
          results.failed++;
          results.details.push({ id: prop.id, status: 'failed', error: `Scrape failed: ${scrapeResponse.status}` });
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';

        if (!markdown || markdown.length < 100) {
          console.log(`❌ No content scraped`);
          results.failed++;
          results.details.push({ id: prop.id, status: 'failed', error: 'No content' });
          continue;
        }

        // Extract data based on source
        const extracted = extractPropertyData(markdown, prop.source);
        console.log(`📊 Extracted:`, JSON.stringify(extracted));

        // Prepare update object with only missing fields
        const updates: Record<string, any> = {};
        
        if (!prop.rooms && extracted.rooms) updates.rooms = extracted.rooms;
        if (!prop.price && extracted.price) updates.price = extracted.price;
        if (!prop.size && extracted.size) updates.size = extracted.size;
        if (!prop.city && extracted.city) updates.city = extracted.city;
        if (!prop.floor && extracted.floor !== undefined) updates.floor = extracted.floor;
        if (!prop.neighborhood && extracted.neighborhood) updates.neighborhood = extracted.neighborhood;

        if (Object.keys(updates).length === 0) {
          console.log(`⏭️ No new data to update`);
          results.skipped++;
          results.details.push({ id: prop.id, status: 'no_new_data', extracted });
          continue;
        }

        if (!dry_run) {
          const { error: updateError } = await supabase
            .from('scouted_properties')
            .update(updates)
            .eq('id', prop.id);

          if (updateError) {
            console.log(`❌ Update failed:`, updateError);
            results.failed++;
            results.details.push({ id: prop.id, status: 'update_failed', error: updateError.message });
            continue;
          }
        }

        console.log(`✅ Updated with:`, JSON.stringify(updates));
        results.updated++;
        results.details.push({ id: prop.id, status: 'updated', extracted: updates });

        // Delay between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 1500));

      } catch (propError) {
        console.error(`Error processing ${prop.id}:`, propError);
        results.failed++;
        results.details.push({ 
          id: prop.id, 
          status: 'error', 
          error: propError instanceof Error ? propError.message : String(propError) 
        });
      }
    }

    console.log(`\n📈 Backfill complete:`, JSON.stringify(results));

    return new Response(JSON.stringify({
      success: true,
      ...results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractPropertyData(markdown: string, source: string): PropertyData {
  const data: PropertyData = {};

  // Extract rooms - look for patterns like "3 חדרים", "3.5 חדרים", "חדרים: 3"
  const roomPatterns = [
    /(\d+\.?\d*)\s*חדר/i,
    /חדרים[:\s]+(\d+\.?\d*)/i,
    /rooms[:\s]+(\d+\.?\d*)/i,
    /(\d+\.?\d*)\s*rooms/i,
  ];
  for (const pattern of roomPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const rooms = parseFloat(match[1]);
      if (rooms >= 1 && rooms <= 15) {
        data.rooms = rooms;
        break;
      }
    }
  }

  // Extract price - look for patterns with ₪ or שקל
  const pricePatterns = [
    /₪\s*([\d,]+)/,
    /([\d,]+)\s*₪/,
    /מחיר[:\s]*([\d,]+)/,
    /price[:\s]*([\d,]+)/i,
    /([\d,]{4,})\s*ש"ח/,
    /([\d,]{4,})\s*שקל/,
  ];
  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const price = parseInt(match[1].replace(/,/g, ''));
      // Valid price range: 1000-50,000,000
      if (price >= 1000 && price <= 50000000) {
        data.price = price;
        break;
      }
    }
  }

  // Extract size - look for patterns with מ"ר or sqm
  const sizePatterns = [
    /(\d+)\s*מ"ר/,
    /(\d+)\s*מטר/,
    /(\d+)\s*sqm/i,
    /(\d+)\s*sq\.?\s*m/i,
    /שטח[:\s]*(\d+)/,
    /size[:\s]*(\d+)/i,
  ];
  for (const pattern of sizePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const size = parseInt(match[1]);
      // Valid size range: 20-1000 sqm
      if (size >= 20 && size <= 1000) {
        data.size = size;
        break;
      }
    }
  }

  // Extract floor
  const floorPatterns = [
    /קומה[:\s]*(\d+)/,
    /floor[:\s]*(\d+)/i,
    /(\d+)\s*קומה/,
  ];
  for (const pattern of floorPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const floor = parseInt(match[1]);
      if (floor >= 0 && floor <= 50) {
        data.floor = floor;
        break;
      }
    }
  }

  // Extract city from content
  const cities = [
    'תל אביב', 'תל-אביב', 'רמת גן', 'גבעתיים', 'הרצליה', 'רעננה', 
    'כפר סבא', 'פתח תקווה', 'ראשון לציון', 'חולון', 'בת ים',
    'נתניה', 'אשדוד', 'באר שבע', 'חיפה', 'ירושלים', 'בני ברק',
    'הוד השרון', 'רחובות', 'נס ציונה', 'אור יהודה', 'יהוד'
  ];
  
  for (const city of cities) {
    if (markdown.includes(city)) {
      data.city = city.replace('-', ' ');
      break;
    }
  }

  // Extract neighborhood - common Tel Aviv neighborhoods
  const neighborhoods = [
    'צפון ישן', 'צפון חדש', 'כיכר המדינה', 'לב העיר', 'מרכז העיר',
    'בבלי', 'נווה צדק', 'כרם התימנים', 'רמת אביב', 'פלורנטין',
    'צהלה', 'רוטשילד', 'נמל תל אביב', 'נחלת בנימין', 'שרונה',
    'לב תל אביב', 'יפו', 'עג\'מי', 'נוה שאנן'
  ];
  
  for (const neighborhood of neighborhoods) {
    if (markdown.includes(neighborhood)) {
      data.neighborhood = neighborhood;
      break;
    }
  }

  return data;
}
