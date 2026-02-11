import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, scrapeWithRetry, validateScrapedContent } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";
import { saveProperty } from "../_shared/property-helpers.ts";
import { parseYad2Markdown } from "../_experimental/parser-yad2.ts";
import { updatePageStatus, incrementRunStats, checkAndFinalizeRun, isRunStopped } from "../_shared/run-helpers.ts";

/**
 * Edge Function for scraping Yad2 - SINGLE PAGE MODE ONLY
 * Each invocation handles exactly one page.
 * Uses NON-AI parser for cost-free extraction.
 */

const YAD2_CONFIG = {
  SOURCE: 'yad2',
  MAX_RETRIES: 2
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Parse request body
  const body = await req.json().catch(() => ({}));
  const page = body.page as number | undefined;
  const runId = body.run_id as string | undefined;
  const configId = body.config_id as string | undefined;
  const maxPages = body.max_pages as number | undefined;

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

    // Check API keys once before looping
    if (!firecrawlApiKey) {
      await updatePageStatus(supabase, runId, page, { 
        status: 'failed', 
        error: 'FIRECRAWL_API_KEY not configured',
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

      // Scrape this URL
      const scrapeData = await scrapeWithRetry(url, firecrawlApiKey, 'yad2', YAD2_CONFIG.MAX_RETRIES);
      
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
      const parseResult = parseYad2Markdown(markdown, config.property_type as 'rent' | 'sale');
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

    // If ALL URLs failed/blocked, don't mark as completed
    if (totalFound === 0 && urlsFailed === urls.length) {
      console.error(`❌ Yad2 page ${page}: All ${urls.length} URL(s) failed or blocked`);
      await updatePageStatus(supabase, runId, page, { 
        status: 'blocked', 
        error: `all_urls_failed_or_blocked (${urlsFailed}/${urls.length})`,
        duration_ms: duration
      });
      if (maxPages) {
        await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
      }
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

    // Check if all pages are done and finalize
    if (maxPages) {
      await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
    }

    console.log(`✅ Yad2 page ${page}: Done | urls=${urls.length} | failed=${urlsFailed} | found=${totalFound} | new=${totalNew} | ${duration}ms`);

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

    if (maxPages) {
      await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2');
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
