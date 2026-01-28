import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { scrapeWithRetry, validateScrapedContent } from '../_personal-scout/scraping.ts';
import { buildPersonalUrl } from '../_personal-scout/url-builder.ts';
import { parseYad2Markdown } from '../_personal-scout/parser-yad2.ts';
import { parseMadlanMarkdown } from '../_personal-scout/parser-madlan.ts';
import { parseHomelessHtml, parseHomelessMarkdown } from '../_personal-scout/parser-homeless.ts';
import { filterByLeadPreferences, hasMinimalPreferences } from '../_personal-scout/feature-filter.ts';
import { extractPaginationInfo, getDefaultPagesToScan } from '../_personal-scout/pagination.ts';
import type { ParsedProperty } from '../_personal-scout/parser-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Personal Scout Worker
 * 
 * Scans properties for a specific lead using their preferences.
 * Uses dynamic pagination - detects total results and scans accordingly.
 */

const MAX_PAGES_PER_SOURCE = 10; // Max pages per source (capped by pagination.ts)
const DELAY_BETWEEN_PAGES_MS = 800; // Delay between pages
const DELAY_BETWEEN_SOURCES_MS = 1000; // Delay between sources

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

    // Fetch existing source_urls for this lead to prevent duplicates
    const { data: existingMatches } = await supabase
      .from('personal_scout_matches')
      .select('source_url')
      .eq('lead_id', lead_id)
      .not('source_url', 'is', null);
    
    const existingUrls = new Set<string>(
      (existingMatches || []).map(m => m.source_url).filter(Boolean)
    );
    console.log(`   📋 Found ${existingUrls.size} existing matches for this lead`);

    const stats = {
      total_scraped: 0,
      total_parsed: 0,
      total_filtered: 0,
      by_source: {} as Record<string, { scraped: number; parsed: number; matched: number }>
    };

    // 2. Scan each source with dynamic pagination
    for (const source of sources) {
      console.log(`\n📡 Scanning ${source} for lead ${leadName}`);
      stats.by_source[source] = { scraped: 0, parsed: 0, matched: 0 };

      // Delay between sources (except first)
      if (sources.indexOf(source) > 0) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_SOURCES_MS));
      }

      // First, scrape page 1 to get pagination info
      const firstPageUrl = buildPersonalUrl({
        source,
        city,
        property_type: propertyType,
        min_price: lead.budget_min,
        max_price: lead.budget_max,
        min_rooms: lead.rooms_min,
        max_rooms: lead.rooms_max,
        balcony_required: lead.balcony_required && !lead.balcony_flexible,
        parking_required: lead.parking_required && !lead.parking_flexible,
        elevator_required: lead.elevator_required && !lead.elevator_flexible,
        neighborhoods: lead.preferred_neighborhoods,
        page: 1
      });

      console.log(`   Page 1 (initial): ${firstPageUrl}`);
      
      const firstPageData = await scrapeWithRetry(firstPageUrl, firecrawlApiKey, source, 2);
      
      if (!firstPageData) {
        console.log(`   ❌ Page 1 blocked/failed - skipping source`);
        continue;
      }

      stats.total_scraped++;
      stats.by_source[source].scraped++;

      const firstMarkdown = firstPageData.data?.markdown || firstPageData.markdown || '';
      const firstHtml = firstPageData.data?.html || firstPageData.html || '';

      // Extract pagination info from first page
      const paginationContent = source === 'homeless' ? firstHtml : firstMarkdown;
      const paginationInfo = extractPaginationInfo(paginationContent, source);
      const pagesToScan = paginationInfo?.pages_to_scan || getDefaultPagesToScan();
      
      console.log(`   📊 Pagination: ${paginationInfo?.total_results || '?'} results, scanning ${pagesToScan} pages`);

      // Process first page
      const firstValidation = validateScrapedContent(firstMarkdown, firstHtml, source);
      if (firstValidation.valid) {
        let properties: ParsedProperty[] = [];
        if (source === 'yad2') {
          properties = parseYad2Markdown(firstMarkdown, propertyType).properties;
        } else if (source === 'madlan') {
          properties = parseMadlanMarkdown(firstMarkdown, propertyType).properties;
        } else if (source === 'homeless') {
          let homelessResult = await parseHomelessHtml(firstHtml, propertyType);
          // Fallback to markdown if HTML parsing found nothing
          if (homelessResult.properties.length === 0 && firstMarkdown.length > 500) {
            console.log(`[personal-scout] HTML parse found 0, trying markdown fallback`);
            homelessResult = parseHomelessMarkdown(firstMarkdown, propertyType);
          }
          properties = homelessResult.properties;
        }

        stats.total_parsed += properties.length;
        stats.by_source[source].parsed += properties.length;
        console.log(`   ✅ Page 1: ${properties.length} properties`);

        const filterResult = filterByLeadPreferences(properties, lead, source);
        const filtered = filterResult.passed;
        
        // Filter out properties we already have for this lead
        const newMatches = filtered.filter(prop => !existingUrls.has(prop.source_url || ''));
        const skippedCount = filtered.length - newMatches.length;

        stats.total_filtered += newMatches.length;
        stats.by_source[source].matched += newMatches.length;
        
        if (skippedCount > 0) {
          console.log(`   🔄 Skipped ${skippedCount} duplicates`);
        }

        for (const prop of newMatches) {
          allMatches.push({
            ...prop,
            lead_id: lead.id,
            source,
            page: 1
          });
          // Add to existingUrls to prevent duplicates from other pages
          if (prop.source_url) existingUrls.add(prop.source_url);
        }
      }

      // Scan remaining pages (2 to pagesToScan)
      for (let page = 2; page <= pagesToScan; page++) {
        try {
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_PAGES_MS));

          const url = buildPersonalUrl({
            source,
            city,
            property_type: propertyType,
            min_price: lead.budget_min,
            max_price: lead.budget_max,
            min_rooms: lead.rooms_min,
            max_rooms: lead.rooms_max,
            balcony_required: lead.balcony_required && !lead.balcony_flexible,
            parking_required: lead.parking_required && !lead.parking_flexible,
            elevator_required: lead.elevator_required && !lead.elevator_flexible,
            neighborhoods: lead.preferred_neighborhoods,
            page
          });

          console.log(`   Page ${page}/${pagesToScan}: ${url}`);

          const scrapeData = await scrapeWithRetry(url, firecrawlApiKey, source, 2);
          
          if (!scrapeData) {
            console.log(`   ❌ Page ${page} blocked/failed`);
            continue;
          }

          stats.total_scraped++;
          stats.by_source[source].scraped++;

          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          const html = scrapeData.data?.html || scrapeData.html || '';

          const validation = validateScrapedContent(markdown, html, source);
          if (!validation.valid) {
            console.log(`   ❌ Validation failed: ${validation.reason}`);
            continue;
          }

          let properties: ParsedProperty[] = [];
          if (source === 'yad2') {
            properties = parseYad2Markdown(markdown, propertyType).properties;
          } else if (source === 'madlan') {
            properties = parseMadlanMarkdown(markdown, propertyType).properties;
          } else if (source === 'homeless') {
            let homelessResult = await parseHomelessHtml(html, propertyType);
            // Fallback to markdown if HTML parsing found nothing
            if (homelessResult.properties.length === 0 && markdown.length > 500) {
              console.log(`[personal-scout] Page ${page}: HTML parse found 0, trying markdown fallback`);
              homelessResult = parseHomelessMarkdown(markdown, propertyType);
            }
            properties = homelessResult.properties;
          }

          stats.total_parsed += properties.length;
          stats.by_source[source].parsed += properties.length;
          console.log(`   ✅ Parsed ${properties.length} properties`);

          const filterResult = filterByLeadPreferences(properties, lead, source);
          const filtered = filterResult.passed;
          
          // Filter out properties we already have for this lead
          const newMatches = filtered.filter(prop => !existingUrls.has(prop.source_url || ''));
          const skippedCount = filtered.length - newMatches.length;

          stats.total_filtered += newMatches.length;
          stats.by_source[source].matched += newMatches.length;
          console.log(`   🎯 After filtering: ${newMatches.length} matches${skippedCount > 0 ? ` (skipped ${skippedCount} duplicates)` : ''}`);

          for (const prop of newMatches) {
            allMatches.push({
              ...prop,
              lead_id: lead.id,
              source,
              page
            });
            // Add to existingUrls to prevent duplicates from other pages
            if (prop.source_url) existingUrls.add(prop.source_url);
          }

        } catch (pageError) {
          console.error(`   Error on page ${page}:`, pageError);
        }
      }
    }

    // 3. Save matches to personal_scout_matches (with upsert to prevent duplicates)
    let savedCount = 0;
    let skippedGenericUrls = 0;
    let skippedProjectUrls = 0;
    let skippedEmptyData = 0;
    
    if (allMatches.length > 0) {
      // Use individual upserts to handle duplicates gracefully
      for (const m of allMatches) {
        // Skip generic Homeless URLs (no specific property ID)
        if (m.source === 'homeless' && m.source_url) {
          if (m.source_url === 'https://www.homeless.co.il' || 
              !m.source_url.includes('/viewad,')) {
            console.log(`   ⏭️ Skipping generic Homeless URL: ${m.source_url}`);
            skippedGenericUrls++;
            continue;
          }
        }
        
        // Skip Madlan project URLs (not individual listings)
        if (m.source === 'madlan' && m.source_url?.includes('/projects/')) {
          console.log(`   ⏭️ Skipping Madlan project URL: ${m.source_url}`);
          skippedProjectUrls++;
          continue;
        }
        
        // Skip properties with no useful data (no price, no rooms, no address)
        if (!m.price && !m.rooms && !m.address) {
          console.log(`   ⏭️ Skipping empty property (no price/rooms/address)`);
          skippedEmptyData++;
          continue;
        }
        
        // Check if this exact source_url + lead_id combo already exists
        const { data: existing } = await supabase
          .from('personal_scout_matches')
          .select('id')
          .eq('lead_id', m.lead_id)
          .eq('source_url', m.source_url)
          .maybeSingle();
        
        if (!existing) {
          const { error: insertError } = await supabase.from('personal_scout_matches').insert({
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
          });

          if (!insertError) {
            savedCount++;
          }
        }
      }
      
      console.log(`💾 Saved ${savedCount} new matches`);
      if (skippedGenericUrls > 0) console.log(`   ⏭️ Skipped ${skippedGenericUrls} generic URLs`);
      if (skippedProjectUrls > 0) console.log(`   ⏭️ Skipped ${skippedProjectUrls} project URLs`);
      if (skippedEmptyData > 0) console.log(`   ⏭️ Skipped ${skippedEmptyData} empty records`);
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
