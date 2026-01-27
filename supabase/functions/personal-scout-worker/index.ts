import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { scrapeWithRetry, validateScrapedContent } from '../_personal-scout/scraping.ts';
import { buildPersonalUrl } from '../_personal-scout/url-builder.ts';
import { parseYad2Markdown } from '../_personal-scout/parser-yad2.ts';
import { parseMadlanMarkdown } from '../_personal-scout/parser-madlan.ts';
import { parseHomelessHtml } from '../_personal-scout/parser-homeless.ts';
import { filterByLeadPreferences, hasMinimalPreferences } from '../_personal-scout/feature-filter.ts';
import type { ParsedProperty } from '../_personal-scout/parser-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Personal Scout Worker
 * 
 * Scans properties for a specific lead using their preferences.
 * COMPLETELY SEPARATE from scout-yad2/madlan/homeless.
 */

const MAX_PAGES_PER_SOURCE = 2; // Reduced to 2 pages to avoid timeouts (60s limit)
const DELAY_BETWEEN_PAGES_MS = 1000; // Reduced delay
const DELAY_BETWEEN_SOURCES_MS = 1500; // Reduced delay

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { lead_id, run_id, sources = ['yad2', 'madlan', 'homeless'] } = await req.json();

    if (!lead_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'lead_id is required' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 1. Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('contact_leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      console.error('Lead not found:', lead_id);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Lead not found' 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const leadName = lead.name || lead_id.substring(0, 8);
    console.log(`🎯 Personal Scout Worker started for: ${leadName}`);
    console.log(`   Cities: ${lead.preferred_cities?.join(', ') || 'N/A'}`);
    console.log(`   Neighborhoods: ${lead.preferred_neighborhoods?.join(', ') || 'N/A'}`);
    console.log(`   Budget: ${lead.budget_min || 'N/A'}-${lead.budget_max || 'N/A'}`);
    console.log(`   Rooms: ${lead.rooms_min || 'N/A'}-${lead.rooms_max || 'N/A'}`);

    // Validate lead has enough preferences
    if (!hasMinimalPreferences(lead)) {
      console.log(`⚠️ Lead ${leadName} doesn't have minimal preferences for personal scout`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Lead lacks minimal preferences (city + budget/rooms/neighborhoods)' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const allMatches: Array<ParsedProperty & { lead_id: string; source: string; page: number }> = [];
    const propertyType = normalizePropertyType(lead.property_type);
    const city = lead.preferred_cities[0]; // Use first preferred city
    
    console.log(`   Property type: ${lead.property_type} → ${propertyType}`);

    const stats = {
      total_scraped: 0,
      total_parsed: 0,
      total_filtered: 0,
      by_source: {} as Record<string, { scraped: number; parsed: number; matched: number }>
    };

    // 2. Scan each source
    for (const source of sources) {
      console.log(`\n📡 Scanning ${source} for lead ${leadName}`);
      stats.by_source[source] = { scraped: 0, parsed: 0, matched: 0 };

      // Delay between sources (except first)
      if (sources.indexOf(source) > 0) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_SOURCES_MS));
      }

      for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
        try {
          // Build URL with lead parameters
          const url = buildPersonalUrl({
            source,
            city,
            property_type: propertyType,
            min_price: lead.budget_min,
            max_price: lead.budget_max,
            min_rooms: lead.rooms_min,
            max_rooms: lead.rooms_max,
            page
          });

          console.log(`   Page ${page}/${MAX_PAGES_PER_SOURCE}: ${url}`);

          // Scrape with EXACT same logic as production
          const scrapeData = await scrapeWithRetry(url, firecrawlApiKey, source, 2);
          
          if (!scrapeData) {
            console.log(`   ❌ Page ${page} blocked/failed`);
            continue;
          }

          stats.total_scraped++;
          stats.by_source[source].scraped++;

          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          const html = scrapeData.data?.html || scrapeData.html || '';

          // Validate with EXACT same logic
          const validation = validateScrapedContent(markdown, html, source);
          if (!validation.valid) {
            console.log(`   ❌ Validation failed: ${validation.reason}`);
            continue;
          }

          // Parse with EXACT same parsers
          let properties: ParsedProperty[] = [];
          if (source === 'yad2') {
            properties = parseYad2Markdown(markdown, propertyType).properties;
          } else if (source === 'madlan') {
            properties = parseMadlanMarkdown(markdown, propertyType).properties;
          } else if (source === 'homeless') {
            properties = parseHomelessHtml(html, propertyType).properties;
          }

          stats.total_parsed += properties.length;
          stats.by_source[source].parsed += properties.length;
          console.log(`   ✅ Parsed ${properties.length} properties`);

          // Filter by lead preferences (neighborhoods, budget for non-Yad2, etc.)
          const filterResult = filterByLeadPreferences(properties, lead, source);
          const filtered = filterResult.passed;

          stats.total_filtered += filtered.length;
          stats.by_source[source].matched += filtered.length;
          console.log(`   🎯 After filtering: ${filtered.length} matches`);

          // Add to results
          for (const prop of filtered) {
            allMatches.push({
              ...prop,
              lead_id: lead.id,
              source,
              page
            });
          }

          // Small delay between pages
          if (page < MAX_PAGES_PER_SOURCE) {
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_PAGES_MS));
          }

        } catch (pageError) {
          console.error(`   Error on page ${page}:`, pageError);
        }
      }
    }

    // 3. Save matches to personal_scout_matches
    let savedCount = 0;
    if (allMatches.length > 0) {
      const { error: insertError } = await supabase.from('personal_scout_matches').insert(
        allMatches.map(m => ({
          run_id,
          lead_id: m.lead_id,
          source: m.source,
          source_url: m.source_url,
          address: m.address,
          city: m.city,
          neighborhood: m.neighborhood,
          price: m.price,
          rooms: m.rooms,
          floor: m.floor,
          size: m.size,
          is_private: m.is_private
        }))
      );

      if (insertError) {
        console.error('Error saving matches:', insertError);
      } else {
        savedCount = allMatches.length;
        console.log(`💾 Saved ${savedCount} matches to database`);
      }
    }

    // 4. Update run statistics if run_id provided
    if (run_id) {
      // Get current values (can't use RPC increment - it doesn't exist)
      const { data: currentRun } = await supabase
        .from('personal_scout_runs')
        .select('leads_completed, total_matches, leads_count')
        .eq('id', run_id)
        .single();
      
      if (currentRun) {
        const newLeadsCompleted = (currentRun.leads_completed || 0) + 1;
        const newTotalMatches = (currentRun.total_matches || 0) + savedCount;
        
        // Check if this was the last lead
        const isComplete = newLeadsCompleted >= (currentRun.leads_count || 0);
        
        const { error: updateError } = await supabase
          .from('personal_scout_runs')
          .update({
            leads_completed: newLeadsCompleted,
            total_matches: newTotalMatches,
            status: isComplete ? 'completed' : 'running',
            completed_at: isComplete ? new Date().toISOString() : null
          })
          .eq('id', run_id);
        
        if (updateError) {
          console.error('Error updating run stats:', updateError);
        } else {
          console.log(`📊 Updated run: ${newLeadsCompleted}/${currentRun.leads_count} leads, ${newTotalMatches} total matches`);
          if (isComplete) {
            console.log(`✅ Run ${run_id} marked as COMPLETED`);
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Personal Scout completed for ${leadName} in ${duration}s`);
    console.log(`   Total matches: ${allMatches.length}`);
    console.log(`   Stats:`, JSON.stringify(stats));

    return new Response(JSON.stringify({
      success: true,
      lead_id,
      lead_name: leadName,
      matches_found: allMatches.length,
      matches_saved: savedCount,
      duration_seconds: parseFloat(duration),
      stats
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Personal Scout Worker error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

/**
 * Normalize property_type to 'rent' | 'sale'
 * Handles: rental, rent, השכרה → rent
 *          sale, מכירה → sale
 */
function normalizePropertyType(type: string | null | undefined): 'rent' | 'sale' {
  if (!type) return 'rent';
  const lower = type.toLowerCase();
  if (lower.includes('rent') || lower === 'rental' || type === 'השכרה') {
    return 'rent';
  }
  if (lower.includes('sale') || type === 'מכירה') {
    return 'sale';
  }
  return 'rent'; // default to rent
}
