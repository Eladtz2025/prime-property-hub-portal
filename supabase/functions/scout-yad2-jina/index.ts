import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateScrapedContent } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";
import { saveProperty } from "../_shared/property-helpers.ts";
import { parseYad2Html } from "../_experimental/parser-yad2-html.ts";
import { updatePageStatus, incrementRunStats, checkAndFinalizeRun, isRunStopped } from "../_shared/run-helpers.ts";

const VERCEL_PROXY_URL = 'https://www.ctmarketproperties.com/api/yad2-proxy';

interface ProxyScrapeResult { html: string; status: number; }

async function scrapeYad2ViaProxy(url: string, maxRetries = 2): Promise<ProxyScrapeResult | null> {
  const proxyKey = Deno.env.get('YAD2_PROXY_KEY');
  if (!proxyKey) {
    console.error('❌ YAD2_PROXY_KEY secret not configured');
    return null;
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);
      console.log(`🌐 Yad2-Proxy scrape attempt ${attempt + 1}/${maxRetries} for ${url}`);

      const response = await fetch(VERCEL_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-proxy-key': proxyKey,
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Yad2-Proxy scrape successful (status=${data.status}, html=${data.length} chars)`);
        if (data.status === 200 && data.html) {
          return { html: data.html, status: data.status };
        }
        console.warn(`⚠️ Proxy returned upstream status ${data.status}`);
        if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
        continue;
      }

      const errorText = await response.text();
      console.warn(`⚠️ Yad2-Proxy attempt ${attempt + 1} failed, status: ${response.status}, error: ${errorText.substring(0, 200)}`);
      if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏱️ Yad2-Proxy attempt ${attempt + 1} timeout`);
      } else {
        console.error(`❌ Yad2-Proxy attempt ${attempt + 1} error:`, error);
      }
      if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
    }
  }
  console.error(`❌ All ${maxRetries} Yad2-Proxy attempts failed for ${url}`);
  return null;
}

/**
 * Edge Function for scraping Yad2 using Jina Reader - SEQUENTIAL MODE
 * Clone of scout-yad2 with Firecrawl replaced by Jina.
 */

const YAD2_CONFIG = {
  SOURCE: 'yad2',
  MAX_RETRIES: 2,
  PAGE_DELAY_MS: 15000,
  RETRY_DELAY_MS: 25000,
  MAX_BLOCK_RETRIES: 2,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.json().catch(() => ({}));
  const page = body.page as number | undefined;
  const runId = body.run_id as string | undefined;
  const configId = body.config_id as string | undefined;
  const maxPages = body.max_pages as number | undefined;
  const startPage = body.start_page as number | undefined;
  const isRetry = body.is_retry as boolean | undefined;
  const retryPages = body.retry_pages as number[] | undefined;

  if (page == null || !runId || !configId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required params: page, run_id, config_id' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const pageStartTime = Date.now();
  console.log(`🟠 scout-yad2-jina: Page ${page} for run ${runId}`);

  try {
    if (await isRunStopped(supabase, runId)) {
      console.log(`🛑 Run ${runId} was stopped, skipping page ${page}`);
      return new Response(JSON.stringify({ success: false, reason: 'stopped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: config, error: configError } = await supabase
      .from('scout_configs').select('*').eq('id', configId).single();
    if (configError || !config) throw new Error('Config not found');

    await updatePageStatus(supabase, runId, page, { status: 'scraping' });

    const urls = buildSinglePageUrl(config, page);
    if (!urls.length) {
      await updatePageStatus(supabase, runId, page, { status: 'failed', error: 'Failed to build URL', duration_ms: Date.now() - pageStartTime });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2-jina');
      return new Response(JSON.stringify({ success: false, error: 'No URL' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (config.property_type === 'both') {
      const errorMsg = 'property_type "both" is not supported';
      await updatePageStatus(supabase, runId, page, { status: 'failed', error: errorMsg, duration_ms: Date.now() - pageStartTime });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2-jina');
      return new Response(JSON.stringify({ success: false, error: errorMsg }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let totalFound = 0;
    let totalNew = 0;
    let urlsFailed = 0;

    console.log(`🟠 Yad2-Jina page ${page}: ${urls.length} URL(s) to scrape`);
    await updatePageStatus(supabase, runId, page, { url: urls[0] });

    for (const url of urls) {
      console.log(`🟠 Yad2-Proxy page ${page}: Scraping ${url}`);

      const scrapeResult = await scrapeYad2ViaProxy(url, YAD2_CONFIG.MAX_RETRIES);
      if (!scrapeResult) {
        console.warn(`⚠️ Yad2-Proxy page ${page}: Scrape failed for ${url}`);
        urlsFailed++;
        continue;
      }

      const { html } = scrapeResult;
      const validation = validateScrapedContent(undefined, html, 'yad2');
      if (!validation.valid) {
        console.warn(`⚠️ Yad2-Proxy page ${page}: Validation failed: ${validation.reason}`);
        urlsFailed++;
        continue;
      }

      const parseResult = parseYad2Html(html, config.property_type as 'rent' | 'sale', config.owner_type_filter);
      const extractedProperties = parseResult.properties;

      console.log(`🟠 Yad2-Proxy page ${page} | found=${extractedProperties.length} | private=${parseResult.stats.private_count} | broker=${parseResult.stats.broker_count}`);

      if (markdown.length > 1000) {
        try {
          await supabase.from('debug_scrape_samples').upsert({
            source: 'yad2', url, html: html?.substring(0, 100000) || null,
            markdown: markdown?.substring(0, 100000) || null,
            properties_found: extractedProperties.length, updated_at: new Date().toISOString()
          }, { onConflict: 'source' });
        } catch (debugErr) { console.warn('Failed to save debug sample:', debugErr); }
      }

      const SAVE_CONCURRENCY = 5;
      let urlNew = 0;
      for (let i = 0; i < extractedProperties.length; i += SAVE_CONCURRENCY) {
        const batch = extractedProperties.slice(i, i + SAVE_CONCURRENCY);
        const results = await Promise.all(batch.map(property => saveProperty(supabase, property)));
        urlNew += results.filter(r => r.isNew).length;
      }

      totalFound += extractedProperties.length;
      totalNew += urlNew;
    }

    const duration = Date.now() - pageStartTime;

    if (totalFound === 0 && urlsFailed === urls.length) {
      const { data: runData } = await supabase.from('scout_runs').select('page_stats').eq('id', runId).single();
      const currentRetryCount = runData?.page_stats?.find((p: any) => p.page === page)?.retry_count || 0;
      await updatePageStatus(supabase, runId, page, { status: 'blocked', error: `all_urls_failed_or_blocked`, duration_ms: duration, retry_count: isRetry ? currentRetryCount : 0 });
      await chainNextPage(supabaseUrl, supabaseServiceKey, supabase, configId, page, runId, maxPages!, startPage, isRetry, retryPages);
      return new Response(JSON.stringify({ success: false, page, error: 'all_urls_failed_or_blocked', duration_ms: duration }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await updatePageStatus(supabase, runId, page, { status: 'completed', found: totalFound, new: totalNew, duration_ms: duration });
    await incrementRunStats(supabase, runId, totalFound, totalNew);

    console.log(`✅ Yad2-Jina page ${page}: Done | found=${totalFound} | new=${totalNew} | ${duration}ms`);
    await chainNextPage(supabaseUrl, supabaseServiceKey, supabase, configId, page, runId, maxPages!, startPage, isRetry, retryPages);

    return new Response(JSON.stringify({ success: true, page, found: totalFound, new: totalNew, duration_ms: duration, parser: 'no-ai' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`scout-yad2-jina page ${page} error:`, error);
    await updatePageStatus(supabase, runId, page, { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error', duration_ms: Date.now() - pageStartTime });
    if (maxPages) await chainNextPage(supabaseUrl, supabaseServiceKey, createClient(supabaseUrl, supabaseServiceKey), configId!, page, runId, maxPages, startPage, isRetry, retryPages);
    return new Response(JSON.stringify({ success: false, page, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function chainNextPage(
  supabaseUrl: string, supabaseKey: string, supabase: any,
  configId: string, currentPage: number, runId: string, maxPages: number,
  startPage?: number, isRetry?: boolean, retryPages?: number[]
): Promise<void> {
  if (isRetry && retryPages?.length) {
    const currentIdx = retryPages.indexOf(currentPage);
    if (currentIdx >= 0 && currentIdx < retryPages.length - 1) {
      await triggerNextPage(supabaseUrl, supabaseKey, configId, retryPages[currentIdx + 1], runId, maxPages, startPage, true, retryPages);
    } else {
      await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2-jina');
    }
  } else if (currentPage < maxPages) {
    await triggerNextPage(supabaseUrl, supabaseKey, configId, currentPage + 1, runId, maxPages, startPage);
  } else {
    await handleRetryOrFinalize(supabase, supabaseUrl, supabaseKey, runId, maxPages, configId, startPage);
  }
}

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
      console.log(`📄 Yad2-Jina: triggering page ${nextPage} (attempt ${attempt})`);
      await fetch(`${supabaseUrl}/functions/v1/scout-yad2-jina`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ config_id: configId, page: nextPage, run_id: runId, max_pages: maxPages, start_page: startPage, is_retry: isRetry, retry_pages: retryPages })
      });
      triggered = true;
      break;
    } catch (err) {
      console.error(`❌ Failed to trigger page ${nextPage} (attempt ${attempt}):`, err);
      if (attempt < MAX_TRIGGER_RETRIES) await new Promise(r => setTimeout(r, TRIGGER_RETRY_DELAY));
    }
  }

  if (!triggered) {
    if (_skipCount < MAX_CONSECUTIVE_SKIPS) {
      await updatePageStatus(supabase, runId, nextPage, { status: 'failed', error: `trigger_failed`, duration_ms: 0 });
      if (isRetry && retryPages?.length) {
        const currentIdx = retryPages.indexOf(nextPage);
        if (currentIdx >= 0 && currentIdx < retryPages.length - 1) {
          await triggerNextPage(supabaseUrl, supabaseKey, configId, retryPages[currentIdx + 1], runId, maxPages, startPage, true, retryPages, _skipCount + 1);
        } else { await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2-jina'); }
      } else if (nextPage < maxPages) {
        await triggerNextPage(supabaseUrl, supabaseKey, configId, nextPage + 1, runId, maxPages, startPage, false, undefined, _skipCount + 1);
      } else { await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2-jina'); }
    } else { await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2-jina'); }
  }
}

async function handleRetryOrFinalize(
  supabase: any, supabaseUrl: string, supabaseKey: string,
  runId: string, maxPages: number, configId: string, startPage?: number
): Promise<void> {
  const { data: run } = await supabase.from('scout_runs').select('page_stats').eq('id', runId).single();
  if (!run?.page_stats) { await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2-jina'); return; }

  const blockedPages = (run.page_stats as any[]).filter(
    (p: any) => p.status === 'blocked' && (p.retry_count || 0) < YAD2_CONFIG.MAX_BLOCK_RETRIES
  );

  if (blockedPages.length === 0) { await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2-jina'); return; }

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
