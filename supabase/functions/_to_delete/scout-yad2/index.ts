import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, scrapeWithRetry, validateScrapedContent } from "../_shared/scraping.ts";
import { getActiveFirecrawlKey } from "../_shared/firecrawl-keys.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";
import { saveProperty } from "../_shared/property-helpers.ts";
import { parseYad2Markdown } from "../_experimental/parser-yad2.ts";
import { updatePageStatus, incrementRunStats, checkAndFinalizeRun, isRunStopped } from "../_shared/run-helpers.ts";

/**
 * Edge Function for scraping Yad2 - SEQUENTIAL MODE
 * Each invocation handles one page, then triggers the next.
 * After all pages complete, retries blocked pages automatically.
 * Uses NON-AI parser for cost-free extraction.
 */

const YAD2_CONFIG = {
  SOURCE: 'yad2',
  MAX_RETRIES: 2,
  PAGE_DELAY_MS: 15000,  // 15s delay before triggering next page
  RETRY_DELAY_MS: 25000, // 25s delay for retried blocked pages
  MAX_BLOCK_RETRIES: 2,  // Max times to retry a blocked page
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Parse request body
  const body = await req.json().catch(() => ({}));
  const page = body.page as number | undefined;
  const runId = body.run_id as string | undefined;
  const configId = body.config_id as string | undefined;
  const maxPages = body.max_pages as number | undefined;
  const startPage = body.start_page as number | undefined;
  const isRetry = body.is_retry as boolean | undefined;
  const retryPages = body.retry_pages as number[] | undefined; // For retry chains

  // Validate required parameters
  // Fix: use == null to allow page === 0 (though unlikely)
  if (page == null || !runId || !configId) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Missing required params: page, run_id, config_id' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const pageStartTime = Date.now();
  console.log(`🟠 scout-yad2 [NO-AI]: Page ${page} for run ${runId}`);

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

    // Build URLs for this page (one per neighborhood for Yad2)
    const urls = buildSinglePageUrl(config, page);
    if (!urls.length) {
      await updatePageStatus(supabase, runId, page, { 
        status: 'failed', 
        error: 'Failed to build URL',
        duration_ms: Date.now() - pageStartTime
      });
      
      if (maxPages) {
        await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
      }
      
      return new Response(JSON.stringify({ success: false, error: 'No URL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get Firecrawl API key (with rotation support)
    let firecrawlKey: { key: string; id: string | null };
    try {
      firecrawlKey = await getActiveFirecrawlKey(supabase);
    } catch {
      await updatePageStatus(supabase, runId, page, { 
        status: 'failed', 
        error: 'No Firecrawl API key available',
        duration_ms: Date.now() - pageStartTime
      });
      if (maxPages) {
        await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
      }
      return new Response(JSON.stringify({ success: false, error: 'No API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Reject 'both' - each config must specify rent OR sale explicitly
    if (config.property_type === 'both') {
      const errorMsg = 'property_type "both" is not supported - create separate configs for rent and sale';
      console.error(`❌ Yad2 page ${page}: ${errorMsg}`);
      await updatePageStatus(supabase, runId, page, { 
        status: 'failed', 
        error: errorMsg,
        duration_ms: Date.now() - pageStartTime
      });
      if (maxPages) {
        await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
      }
      return new Response(JSON.stringify({ success: false, error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Loop over all URLs (one per neighborhood for Yad2)
    let totalFound = 0;
    let totalNew = 0;
    let urlsFailed = 0;

    console.log(`🟠 Yad2 page ${page}: ${urls.length} URL(s) to scrape`);
    await updatePageStatus(supabase, runId, page, { url: urls[0] });

    for (const url of urls) {
      console.log(`🟠 Yad2 page ${page}: Scraping ${url}`);

      // Scrape this URL (with key rotation support)
      const scrapeData = await scrapeWithRetry(url, firecrawlKey.key, 'yad2', YAD2_CONFIG.MAX_RETRIES, undefined, { supabase, keyId: firecrawlKey.id });
      
      if (!scrapeData) {
        console.warn(`⚠️ Yad2 page ${page}: Scrape failed for ${url}, continuing to next URL`);
        urlsFailed++;
        continue;
      }

      const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
      const html = scrapeData.data?.html || scrapeData.html || '';

      const validation = validateScrapedContent(markdown, html, 'yad2');
      if (!validation.valid) {
        console.warn(`⚠️ Yad2 page ${page}: Validation failed for ${url}: ${validation.reason}`);
        urlsFailed++;
        continue;
      }

      // Parse with NON-AI parser
      const parseResult = parseYad2Markdown(markdown, config.property_type as 'rent' | 'sale', config.owner_type_filter);
      const extractedProperties = parseResult.properties;

      // Structured log per URL
      console.log(`🟠 Yad2 page ${page} | config=${configId} | url=${url} | found=${extractedProperties.length} | private=${parseResult.stats.private_count} | broker=${parseResult.stats.broker_count}`);

      if (extractedProperties.length === 0) {
        console.warn(`⚠️ Yad2 page ${page}: 0 properties from ${url} (markdown: ${markdown?.length || 0} chars)`);
      }

      // Save debug sample
      if (markdown.length > 1000) {
        try {
          await supabase.from('debug_scrape_samples').upsert({
            source: 'yad2',
            url: url,
            html: html?.substring(0, 100000) || null,
            markdown: markdown?.substring(0, 100000) || null,
            properties_found: extractedProperties.length,
            updated_at: new Date().toISOString()
          }, { onConflict: 'source' });
        } catch (debugErr) {
          console.warn('Failed to save debug sample:', debugErr);
        }
      }

      // Save properties with limited concurrency
      const SAVE_CONCURRENCY = 5;
      let urlNew = 0;
      for (let i = 0; i < extractedProperties.length; i += SAVE_CONCURRENCY) {
        const batch = extractedProperties.slice(i, i + SAVE_CONCURRENCY);
        const results = await Promise.all(
          batch.map(property => saveProperty(supabase, property))
        );
        urlNew += results.filter(r => r.isNew).length;
      }

      totalFound += extractedProperties.length;
      totalNew += urlNew;
    }

    const duration = Date.now() - pageStartTime;

    // If ALL URLs failed/blocked, mark as blocked
    if (totalFound === 0 && urlsFailed === urls.length) {
      console.error(`❌ Yad2 page ${page}: All ${urls.length} URL(s) failed or blocked`);
      
      // Get current retry count from page_stats
      const { data: runData } = await supabase
        .from('scout_runs')
        .select('page_stats')
        .eq('id', runId)
        .single();
      const currentRetryCount = runData?.page_stats?.find((p: any) => p.page === page)?.retry_count || 0;
      
      await updatePageStatus(supabase, runId, page, { 
        status: 'blocked', 
        error: `all_urls_failed_or_blocked (${urlsFailed}/${urls.length})`,
        duration_ms: duration,
        retry_count: isRetry ? currentRetryCount : 0
      });

      // Chain to next page
      await chainNextPage(supabaseUrl, supabaseServiceKey, supabase, configId, page, runId, maxPages!, startPage, isRetry, retryPages);

      return new Response(JSON.stringify({
        success: false,
        page,
        error: 'all_urls_failed_or_blocked',
        urls_failed: urlsFailed,
        urls_total: urls.length,
        duration_ms: duration
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update page stats with aggregated results
    await updatePageStatus(supabase, runId, page, { 
      status: 'completed',
      found: totalFound,
      new: totalNew,
      duration_ms: duration
    });

    // Update run totals atomically
    await incrementRunStats(supabase, runId, totalFound, totalNew);

    console.log(`✅ Yad2 page ${page}: Done | urls=${urls.length} | failed=${urlsFailed} | found=${totalFound} | new=${totalNew} | ${duration}ms`);

    // Chain to next page
    await chainNextPage(supabaseUrl, supabaseServiceKey, supabase, configId, page, runId, maxPages!, startPage, isRetry, retryPages);

    return new Response(JSON.stringify({
      success: true,
      page,
      urls_scraped: urls.length - urlsFailed,
      urls_failed: urlsFailed,
      found: totalFound,
      new: totalNew,
      duration_ms: duration,
      parser: 'no-ai'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`scout-yad2 page ${page} error:`, error);
    
    await updatePageStatus(supabase, runId, page, { 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - pageStartTime
    });

    // Chain to next page even on error
    if (maxPages) {
      await chainNextPage(supabaseUrl, supabaseServiceKey, createClient(supabaseUrl, supabaseServiceKey), configId!, page, runId, maxPages, startPage, isRetry, retryPages);
    }

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

/**
 * Determine and trigger the next page in the chain (normal or retry mode)
 */
async function chainNextPage(
  supabaseUrl: string, supabaseKey: string, supabase: any,
  configId: string, currentPage: number, runId: string, maxPages: number,
  startPage?: number, isRetry?: boolean, retryPages?: number[]
): Promise<void> {
  if (isRetry && retryPages?.length) {
    // In retry mode - find next page in retry list
    const currentIdx = retryPages.indexOf(currentPage);
    if (currentIdx >= 0 && currentIdx < retryPages.length - 1) {
      const nextPage = retryPages[currentIdx + 1];
      await triggerNextPage(supabaseUrl, supabaseKey, configId, nextPage, runId, maxPages, startPage, true, retryPages);
    } else {
      // All retry pages done - finalize
      await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
    }
  } else if (currentPage < maxPages) {
    // Normal mode - next sequential page
    await triggerNextPage(supabaseUrl, supabaseKey, configId, currentPage + 1, runId, maxPages, startPage);
  } else {
    // Last page - check for blocked pages to retry
    await handleRetryOrFinalize(supabase, supabaseUrl, supabaseKey, runId, maxPages, configId, startPage);
  }
}

/**
 * Trigger the next page with a delay
 */
async function triggerNextPage(
  supabaseUrl: string, supabaseKey: string, configId: string,
  nextPage: number, runId: string, maxPages: number,
  startPage?: number, isRetry = false, retryPages?: number[],
  _skipCount: number = 0
): Promise<void> {
  const MAX_TRIGGER_RETRIES = 3;
  const TRIGGER_RETRY_DELAY = 5000;
  const MAX_CONSECUTIVE_SKIPS = 3;
  const delay = isRetry ? YAD2_CONFIG.RETRY_DELAY_MS : YAD2_CONFIG.PAGE_DELAY_MS;
  
  console.log(`⏳ Waiting ${delay / 1000}s before page ${nextPage}${isRetry ? ' (retry)' : ''}...`);
  await new Promise(r => setTimeout(r, delay));

  const supabase = createClient(supabaseUrl, supabaseKey);
  if (await isRunStopped(supabase, runId)) {
    console.log(`🛑 Run ${runId} stopped, skipping page ${nextPage}`);
    return;
  }

  let triggered = false;
  for (let attempt = 1; attempt <= MAX_TRIGGER_RETRIES; attempt++) {
    try {
      console.log(`📄 Yad2: triggering page ${nextPage} (attempt ${attempt}/${MAX_TRIGGER_RETRIES})`);
      await fetch(`${supabaseUrl}/functions/v1/scout-yad2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          config_id: configId, page: nextPage, run_id: runId,
          max_pages: maxPages, start_page: startPage,
          is_retry: isRetry, retry_pages: retryPages
        })
      });
      console.log(`📄 Triggered Yad2 page ${nextPage}`);
      triggered = true;
      break;
    } catch (err) {
      console.error(`❌ Failed to trigger page ${nextPage} (attempt ${attempt}):`, err);
      if (attempt < MAX_TRIGGER_RETRIES) {
        await new Promise(r => setTimeout(r, TRIGGER_RETRY_DELAY));
      }
    }
  }

  // SKIP LOGIC: If trigger failed after all retries, skip to next page
  if (!triggered) {
    if (_skipCount < MAX_CONSECUTIVE_SKIPS) {
      console.warn(`⏭️ Yad2: skipping page ${nextPage}, marking as failed (skip ${_skipCount + 1}/${MAX_CONSECUTIVE_SKIPS})`);
      await updatePageStatus(supabase, runId, nextPage, {
        status: 'failed',
        error: `trigger_failed_after_${MAX_TRIGGER_RETRIES}_attempts`,
        duration_ms: 0
      });

      if (isRetry && retryPages?.length) {
        const currentIdx = retryPages.indexOf(nextPage);
        if (currentIdx >= 0 && currentIdx < retryPages.length - 1) {
          await triggerNextPage(supabaseUrl, supabaseKey, configId, retryPages[currentIdx + 1], runId, maxPages, startPage, true, retryPages, _skipCount + 1);
        } else {
          await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
        }
      } else if (nextPage < maxPages) {
        await triggerNextPage(supabaseUrl, supabaseKey, configId, nextPage + 1, runId, maxPages, startPage, false, undefined, _skipCount + 1);
      } else {
        await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
      }
    } else {
      console.error(`❌ Yad2: ${MAX_CONSECUTIVE_SKIPS} consecutive skips reached, finalizing run`);
      await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
    }
  }
}

/**
 * After all pages done, retry blocked pages or finalize
 */
async function handleRetryOrFinalize(
  supabase: any, supabaseUrl: string, supabaseKey: string,
  runId: string, maxPages: number, configId: string, startPage?: number
): Promise<void> {
  const { data: run } = await supabase.from('scout_runs').select('page_stats').eq('id', runId).single();
  if (!run?.page_stats) { await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2'); return; }

  const blockedPages = (run.page_stats as any[]).filter(
    (p: any) => p.status === 'blocked' && (p.retry_count || 0) < YAD2_CONFIG.MAX_BLOCK_RETRIES
  );

  if (blockedPages.length === 0) {
    await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
    return;
  }

  console.log(`🔄 Retrying ${blockedPages.length} blocked pages for run ${runId}`);
  const updatedStats = (run.page_stats as any[]).map((p: any) => {
    if (p.status === 'blocked' && (p.retry_count || 0) < YAD2_CONFIG.MAX_BLOCK_RETRIES) {
      return { ...p, status: 'pending', error: undefined, retry_count: (p.retry_count || 0) + 1 };
    }
    return p;
  });
  await supabase.from('scout_runs').update({ page_stats: updatedStats }).eq('id', runId);

  const retryPageNumbers = blockedPages.map((p: any) => p.page);
  await triggerNextPage(supabaseUrl, supabaseKey, configId, retryPageNumbers[0], runId, maxPages, startPage, true, retryPageNumbers);
}
