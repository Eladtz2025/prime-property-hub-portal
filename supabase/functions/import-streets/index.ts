import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tel Aviv neighborhoods for AI mapping
const NEIGHBORHOODS = [
  'צפון_ישן', 'צפון_חדש', 'מרכז_העיר', 'פלורנטין', 'נווה_צדק', 
  'רוטשילד', 'כרם_התימנים', 'כיכר_המדינה', 'רמת_אביב', 'יפו',
  'צהלה', 'בבלי', 'נמל_תל_אביב', 'תל_ברוך', 'דרום_תל_אביב',
  'אזורי_חן', 'נווה_אביבים', 'הדר_יוסף', 'נווה_שרת'
];

// Street to neighborhood mapping based on known data
const KNOWN_MAPPINGS: Record<string, string> = {
  // צפון ישן
  'ארלוזורוב': 'צפון_ישן',
  'נורדאו': 'צפון_ישן',
  'ז\'בוטינסקי': 'צפון_ישן',
  'ירמיהו': 'צפון_ישן',
  'בן גוריון': 'צפון_ישן',
  'דוד המלך': 'צפון_ישן',
  'פנקס': 'צפון_ישן',
  'יהושע בן נון': 'צפון_ישן',
  
  // צפון חדש
  'לואי מרשל': 'צפון_חדש',
  'יהודה המכבי': 'צפון_חדש',
  'וייצמן': 'צפון_חדש',
  'דה האז': 'צפון_חדש',
  'ברנשטיין כהן': 'צפון_חדש',
  'קפלן': 'צפון_חדש',
  'לאונרדו דה וינצ\'י': 'צפון_חדש',
  
  // מרכז העיר
  'דיזנגוף': 'מרכז_העיר',
  'בן יהודה': 'מרכז_העיר',
  'אלנבי': 'מרכז_העיר',
  'הירקון': 'מרכז_העיר',
  'פרישמן': 'מרכז_העיר',
  'גורדון': 'מרכז_העיר',
  'בוגרשוב': 'מרכז_העיר',
  'מזא\'ה': 'מרכז_העיר',
  
  // רוטשילד
  'רוטשילד': 'רוטשילד',
  'מונטיפיורי': 'רוטשילד',
  'נחמני': 'רוטשילד',
  'מזרחי': 'רוטשילד',
  'שדרות רוטשילד': 'רוטשילד',
  
  // פלורנטין
  'פלורנטין': 'פלורנטין',
  'שלוש': 'פלורנטין',
  'ויטל': 'פלורנטין',
  'ירמיהו': 'פלורנטין',
  
  // נווה צדק
  'שבזי': 'נווה_צדק',
  'אהד העם': 'נווה_צדק',
  'יחיאלי': 'נווה_צדק',
  'פינס': 'נווה_צדק',
  
  // רמת אביב
  'איינשטיין': 'רמת_אביב',
  'מודעי': 'רמת_אביב',
  'לבונטין': 'רמת_אביב',
  'קלמן מגן': 'רמת_אביב',
  'חיים לבנון': 'רמת_אביב',
  
  // יפו
  'יפת': 'יפו',
  'ירקון': 'יפו',
  'רבי פנחס': 'יפו',
  'קדם': 'יפו',
  
  // בבלי
  'דה האז': 'בבלי',
  'שאול המלך': 'בבלי',
  
  // צהלה
  'גרונר': 'צהלה',
  'רזיאל': 'צהלה',
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

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'scan'; // 'scan' | 'import' | 'map_neighborhoods'
    const letter = body.letter; // Optional: specific letter to process

    if (mode === 'scan') {
      // Scan existing streets and find gaps
      const { data: existingStreets } = await supabase
        .from('street_neighborhoods')
        .select('street_name')
        .eq('city', 'תל אביב יפו');

      const existingSet = new Set(existingStreets?.map(s => s.street_name.trim().toLowerCase()) || []);
      
      // Get properties with addresses that don't have neighborhood mapping
      const { data: unmappedProperties, error } = await supabase
        .from('scouted_properties')
        .select('address, city')
        .eq('city', 'תל אביב יפו')
        .is('neighborhood', null)
        .not('address', 'is', null)
        .limit(500);

      if (error) throw error;

      // Extract street names from addresses
      const unmappedStreets = new Set<string>();
      for (const prop of unmappedProperties || []) {
        if (!prop.address) continue;
        // Extract street name (remove house number)
        const streetMatch = prop.address.match(/^([א-ת\s\-\'\"]+)/);
        if (streetMatch) {
          const streetName = streetMatch[1].trim();
          if (streetName.length > 2 && !existingSet.has(streetName.toLowerCase())) {
            unmappedStreets.add(streetName);
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        existing_streets: existingSet.size,
        unmapped_properties: unmappedProperties?.length || 0,
        missing_streets: Array.from(unmappedStreets).slice(0, 100),
        total_missing: unmappedStreets.size
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (mode === 'import') {
      // Import streets from Wikibooks
      const letters = letter ? [letter] : ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'];
      
      const allStreets: string[] = [];
      const errors: string[] = [];

      for (const l of letters) {
        try {
          const url = `https://he.wikibooks.org/wiki/מדריך_רחובות_תל_אביב-יפו/${l}`;
          console.log(`Scraping: ${url}`);

          if (!firecrawlApiKey) {
            errors.push(`No Firecrawl API key`);
            continue;
          }

          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${firecrawlApiKey}`
            },
            body: JSON.stringify({
              url,
              formats: ['markdown']
            })
          });

          if (!response.ok) {
            errors.push(`Failed to scrape ${l}: ${response.status}`);
            continue;
          }

          const data = await response.json();
          const markdown = data.data?.markdown || '';
          
          // Extract street names from markdown
          // Wikibooks format: typically "* **רחוב שם** - תיאור"
          const streetMatches = markdown.matchAll(/\*\*([א-ת\s\-\'\"]+)\*\*/g);
          for (const match of streetMatches) {
            const streetName = match[1].trim();
            if (streetName.length > 2 && streetName.length < 50) {
              allStreets.push(streetName);
            }
          }

          // Also try simpler patterns
          const lines = markdown.split('\n');
          for (const line of lines) {
            // Pattern: "* רחוב שם" or "- רחוב שם"
            const lineMatch = line.match(/^[\*\-]\s*([א-ת\s\-\'\"]{3,40})/);
            if (lineMatch) {
              const streetName = lineMatch[1].trim();
              if (!allStreets.includes(streetName)) {
                allStreets.push(streetName);
              }
            }
          }

          // Add delay between requests
          await new Promise(r => setTimeout(r, 1000));

        } catch (err) {
          errors.push(`Error processing ${l}: ${err instanceof Error ? err.message : 'Unknown'}`);
        }
      }

      // Get existing streets
      const { data: existingStreets } = await supabase
        .from('street_neighborhoods')
        .select('street_name')
        .eq('city', 'תל אביב יפו');

      const existingSet = new Set(existingStreets?.map(s => s.street_name.trim().toLowerCase()) || []);

      // Filter new streets
      const newStreets = allStreets.filter(s => !existingSet.has(s.toLowerCase()));

      return new Response(JSON.stringify({
        success: true,
        total_scraped: allStreets.length,
        new_streets: newStreets.length,
        streets: newStreets.slice(0, 200),
        errors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (mode === 'map_neighborhoods') {
      // Map neighborhoods for streets that don't have one
      const streets = body.streets as string[] || [];
      
      if (streets.length === 0) {
        // Get streets without neighborhood from DB
        const { data: unmappedStreets } = await supabase
          .from('street_neighborhoods')
          .select('id, street_name')
          .eq('city', 'תל אביב יפו')
          .is('neighborhood', null)
          .limit(50);

        if (!unmappedStreets?.length) {
          return new Response(JSON.stringify({
            success: true,
            message: 'No unmapped streets found'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        streets.push(...unmappedStreets.map(s => s.street_name));
      }

      const mappings: Array<{ street: string; neighborhood: string; confidence: string }> = [];

      // First, use known mappings
      for (const street of streets) {
        const knownNeighborhood = KNOWN_MAPPINGS[street];
        if (knownNeighborhood) {
          mappings.push({ street, neighborhood: knownNeighborhood, confidence: 'high' });
        }
      }

      // For remaining streets, use AI
      const unmappedForAI = streets.filter(s => !KNOWN_MAPPINGS[s]);
      
      if (unmappedForAI.length > 0 && lovableApiKey) {
        const prompt = `מפה את הרחובות הבאים בתל אביב לשכונות.

רחובות: ${unmappedForAI.join(', ')}

שכונות אפשריות: ${NEIGHBORHOODS.join(', ')}

החזר JSON בפורמט:
[{"street": "שם רחוב", "neighborhood": "שם_שכונה", "confidence": "high/medium/low"}]

אם לא בטוח, השתמש ב-confidence: "low"`;

        try {
          const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${lovableApiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_object' }
            })
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content || '{}';
            const parsed = JSON.parse(content);
            
            if (Array.isArray(parsed)) {
              mappings.push(...parsed);
            } else if (parsed.mappings) {
              mappings.push(...parsed.mappings);
            }
          }
        } catch (err) {
          console.error('AI mapping error:', err);
        }
      }

      // Insert mappings into database
      const insertedCount = 0;
      for (const mapping of mappings) {
        if (mapping.neighborhood && NEIGHBORHOODS.includes(mapping.neighborhood)) {
          await supabase
            .from('street_neighborhoods')
            .upsert({
              city: 'תל אביב יפו',
              street_name: mapping.street,
              neighborhood: mapping.neighborhood,
              source: mapping.confidence === 'high' ? 'known' : 'ai_mapped'
            }, {
              onConflict: 'city,street_name,number_from,number_to'
            });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        mapped: mappings.length,
        mappings
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (mode === 'add_missing') {
      // Add missing streets from the scan
      const streetsToAdd = body.streets as string[] || [];
      
      let added = 0;
      for (const street of streetsToAdd) {
        const neighborhood = KNOWN_MAPPINGS[street] || null;
        
        const { error } = await supabase
          .from('street_neighborhoods')
          .upsert({
            city: 'תל אביב יפו',
            street_name: street,
            neighborhood: neighborhood,
            source: neighborhood ? 'known' : 'imported'
          }, {
            onConflict: 'city,street_name,number_from,number_to',
            ignoreDuplicates: true
          });

        if (!error) added++;
      }

      return new Response(JSON.stringify({
        success: true,
        added,
        total: streetsToAdd.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid mode. Use: scan, import, map_neighborhoods, or add_missing'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Import streets error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
