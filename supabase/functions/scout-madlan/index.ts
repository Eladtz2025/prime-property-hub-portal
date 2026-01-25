import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, scrapeMadlanDirect, validateScrapedContent } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";
import { saveProperty } from "../_shared/property-helpers.ts";
import { parseMadlanMarkdown } from "../_experimental/parser-madlan.ts";
import { updatePageStatus, incrementRunStats, checkAndFinalizeRun, isRunStopped } from "../_shared/run-helpers.ts";

/**
 * Edge Function for scraping Madlan - DIRECT FETCH MODE
 * Bypasses Firecrawl entirely using direct HTTP requests.
 * Uses NON-AI parser for cost-free extraction.
 * Cost: 0 Firecrawl credits | Speed: 1-3 seconds per page
 */

const MADLAN_CONFIG = {
  SOURCE: 'madlan',
  MAX_RETRIES: 2,           // Fewer retries needed with direct fetch
  NEXT_PAGE_DELAY: 3000,    // 3 seconds between pages - much faster
  RECOVERY_DELAY: 10000     // 10 seconds after a failure
};

/**
 * Calculate actual max pages based on page_stats length
 * This ensures finalization works correctly with startPage offset
 */
function getActualMaxPages(pageStats: any[] | null, startPage: number, maxPages: number): number {
  if (pageStats && pageStats.length > 0) {
    return pageStats.length;
  }
  return maxPages - startPage + 1;
}

/**
 * Trigger the next page in sequence (Madlan sequential mode)
 */
async function triggerNextPage(
  supabaseUrl: string,
  supabaseServiceKey: string,
  configId: string,
  nextPage: number,
  runId: string,
  maxPages: number,
  startPage: number
): Promise<void> {
  console.log(`📄 Madlan: triggering page ${nextPage}/${maxPages}`);
  
  try {
    await fetch(`${supabaseUrl}/functions/v1/scout-madlan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        config_id: configId,
        page: nextPage,
        run_id: runId,
        max_pages: maxPages,
        start_page: startPage
      })
    });
  } catch (error) {
    console.error(`Error triggering Madlan page ${nextPage}:`, error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // Note: Firecrawl is no longer used for Madlan - direct fetch instead

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Parse request body
  const body = await req.json().catch(() => ({}));
  const page = body.page as number | undefined;
  const runId = body.run_id as string | undefined;
  const configId = body.config_id as string | undefined;
  const maxPages = body.max_pages as number | undefined;
  const startPage = body.start_page as number || 1;  // Default to 1 - simplified approach

  // Validate required parameters
  if (!page || !runId || !configId) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Missing required params: page, run_id, config_id' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const pageStartTime = Date.now();
  console.log(`🔵 scout-madlan [NO-AI]: Page ${page} for run ${runId}`);

  try {
    // Check if run was stopped
    if (await isRunStopped(supabase, runId)) {
      console.log(`🛑 Run ${runId} was stopped, skipping page ${page}`);
      return new Response(JSON.stringify({ success: false, reason: 'stopped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get config
    const { data: config, error: configError } = await supabase
      .from('scout_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      throw new Error('Config not found');
    }

    // Update page status to 'scraping'
    await updatePageStatus(supabase, runId, page, { status: 'scraping' });

    // Build URL for this page
    const urls = buildSinglePageUrl(config, page);
    if (!urls.length) {
      await updatePageStatus(supabase, runId, page, { 
        status: 'failed', 
        error: 'Failed to build URL',
        duration_ms: Date.now() - pageStartTime
      });
      
      if (maxPages) {
        await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan');
      }
      
      return new Response(JSON.stringify({ success: false, error: 'No URL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = urls[0];
    console.log(`🔵 Madlan page ${page}: Direct fetch ${url}`);
    await updatePageStatus(supabase, runId, page, { url });

    // DIRECT FETCH: Bypass Firecrawl entirely - no API key needed!
    // This avoids Firecrawl's blocked IP pool and costs 0 credits
    let scrapeData: { markdown: string; html: string } | null = null;
    
    for (let attempt = 0; attempt < MADLAN_CONFIG.MAX_RETRIES; attempt++) {
      scrapeData = await scrapeMadlanDirect(url);
      if (scrapeData) break;
      
      if (attempt < MADLAN_CONFIG.MAX_RETRIES - 1) {
        console.log(`[Madlan] Retry ${attempt + 2}/${MADLAN_CONFIG.MAX_RETRIES} in 2s...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    if (!scrapeData) {
      console.error(`All retry attempts failed for Madlan page ${page}`);
      await updatePageStatus(supabase, runId, page, { 
        status: 'blocked', 
        error: 'Scrape failed - possible CAPTCHA',
        duration_ms: Date.now() - pageStartTime
      });
      
      // SEQUENTIAL MODE: Trigger next page even after block (with recovery delay)
      if (maxPages && page < maxPages) {
        const { data: runCheck } = await supabase
          .from('scout_runs')
          .select('status')
          .eq('id', runId)
          .single();
        
        if (runCheck?.status !== 'stopped') {
          console.log(`⏳ Madlan: blocked, waiting ${MADLAN_CONFIG.RECOVERY_DELAY/1000}s before page ${page + 1}`);
          await new Promise(r => setTimeout(r, MADLAN_CONFIG.RECOVERY_DELAY));
          await triggerNextPage(supabaseUrl, supabaseServiceKey, configId, page + 1, runId, maxPages, startPage);
        }
      }
      
      // ALWAYS check and finalize - use page_stats length for accurate count
      await checkAndFinalizeRun(supabase, runId, maxPages - startPage + 1, 'madlan');
      
      return new Response(JSON.stringify({ success: false, error: 'Direct fetch failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Direct fetch returns markdown and html directly (not nested in .data)
    const markdown = scrapeData.markdown || '';
    const html = scrapeData.html || '';

    const validation = validateScrapedContent(markdown, html, 'madlan');
    if (!validation.valid) {
      console.error(`Madlan content validation failed: ${validation.reason}`);
      await updatePageStatus(supabase, runId, page, { 
        status: 'blocked', 
        error: validation.reason || 'Content validation failed',
        duration_ms: Date.now() - pageStartTime
      });
      
      // SEQUENTIAL MODE: Trigger next page even after validation failure (with recovery delay)
      if (maxPages && page < maxPages) {
        const { data: runCheck } = await supabase
          .from('scout_runs')
          .select('status')
          .eq('id', runId)
          .single();
        
        if (runCheck?.status !== 'stopped') {
          console.log(`⏳ Madlan: validation failed, waiting ${MADLAN_CONFIG.RECOVERY_DELAY/1000}s before page ${page + 1}`);
          await new Promise(r => setTimeout(r, MADLAN_CONFIG.RECOVERY_DELAY));
          await triggerNextPage(supabaseUrl, supabaseServiceKey, configId, page + 1, runId, maxPages, startPage);
        }
      }
      
      // ALWAYS check and finalize
      await checkAndFinalizeRun(supabase, runId, maxPages - startPage + 1, 'madlan');
      
      return new Response(JSON.stringify({ success: false, error: 'Validation failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract properties with NON-AI parser
    const propertyTypeForParsing = config.property_type === 'both' ? 'rent' : config.property_type;
    const parseResult = parseMadlanMarkdown(markdown, propertyTypeForParsing);
    const extractedProperties = parseResult.properties;

    console.log(`🔵 Madlan page ${page}: [NO-AI] Parsed ${extractedProperties.length} properties (${parseResult.stats.private_count} private)`);

    if (extractedProperties.length === 0) {
      console.warn(`⚠️ Madlan page ${page}: 0 properties extracted`);
      console.warn(`   Markdown length: ${markdown?.length || 0} chars`);
    }

    // Save raw HTML/Markdown sample for parser debugging (any successful page)
    if (markdown.length > 1000 && extractedProperties.length > 0) {
      try {
        await supabase.from('debug_scrape_samples').upsert({
          source: 'madlan',
          url: url,
          html: html?.substring(0, 100000) || null,
          markdown: markdown?.substring(0, 100000) || null,
          properties_found: extractedProperties.length,
          updated_at: new Date().toISOString()
        }, { onConflict: 'source' });
        console.log(`📝 Saved debug sample for madlan (${markdown.length} chars)`);
      } catch (debugErr) {
        console.warn('Failed to save debug sample:', debugErr);
      }
    }

    // Save properties and count new ones
    let pageNew = 0;
    for (const property of extractedProperties) {
      const result = await saveProperty(supabase, property);
      if (result.isNew) {
        pageNew++;
      }
    }

    const duration = Date.now() - pageStartTime;

    // Update page stats with results
    await updatePageStatus(supabase, runId, page, { 
      status: 'completed',
      found: extractedProperties.length,
      new: pageNew,
      duration_ms: duration
    });

    // Update run totals atomically
    await incrementRunStats(supabase, runId, extractedProperties.length, pageNew);

    // SEQUENTIAL MODE: Trigger next page after success (with normal delay)
    if (maxPages && page < maxPages) {
      const { data: runCheck } = await supabase
        .from('scout_runs')
        .select('status')
        .eq('id', runId)
        .single();
      
      if (runCheck?.status !== 'stopped') {
        console.log(`⏳ Madlan: success, waiting ${MADLAN_CONFIG.NEXT_PAGE_DELAY/1000}s before page ${page + 1}`);
        await new Promise(r => setTimeout(r, MADLAN_CONFIG.NEXT_PAGE_DELAY));
        await triggerNextPage(supabaseUrl, supabaseServiceKey, configId, page + 1, runId, maxPages, startPage);
      }
    }

    // ALWAYS check if all pages are done and finalize (use actual page count)
    await checkAndFinalizeRun(supabase, runId, maxPages - startPage + 1, 'madlan');

    return new Response(JSON.stringify({
      success: true,
      page,
      found: extractedProperties.length,
      new: pageNew,
      duration_ms: duration,
      parser: 'no-ai',
      next_page: page < maxPages ? page + 1 : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`scout-madlan page ${page} error:`, error);
    
    await updatePageStatus(supabase, runId, page, { 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - pageStartTime
    });

    // ALWAYS check and finalize on error
    await checkAndFinalizeRun(supabase, runId, maxPages - startPage + 1, 'madlan');

    return new Response(JSON.stringify({
      success: false,
      page,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
