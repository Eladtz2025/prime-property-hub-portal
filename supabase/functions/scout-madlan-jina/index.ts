import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateScrapedContent } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";

interface JinaScrapeResult { markdown: string; html: string; }

async function scrapeMadlanWithJina(url: string, maxRetries = 3): Promise<JinaScrapeResult | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      console.log(`🌐 Madlan-Jina attempt ${attempt + 1}/${maxRetries} for ${url}`);

      const response = await fetch(`https://r.jina.ai/${url}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/markdown',
          'X-No-Cache': 'true',
          'X-Wait-For-Selector': 'a[href*="/realestate/item/"]',
          'X-Timeout': '30',
          'X-Proxy-Country': 'IL',
          'X-Locale': 'he-IL',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const body = await response.text();
        const classification = classifyMadlanContent(body, url);
        logMadlanScrapeResult('scout', url, body.length, classification);

        if (isMadlanBlocked(body, url)) {
          console.warn(`⚠️ Madlan-Jina attempt ${attempt + 1}: blocked/skeleton (${body.length} chars, ${classification})`);
          if (attempt < maxRetries - 1) {
            const waitTime = 5000 * (attempt + 1);
            console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
            await new Promise(r => setTimeout(r, waitTime));
          }
          continue;
        }

        console.log(`✅ Madlan-Jina scrape successful (${body.length} chars)`);
        return { markdown: body, html: '' };
      }

      const errorText = await response.text();
      console.warn(`⚠️ Madlan-Jina attempt ${attempt + 1} failed, status: ${response.status}, error: ${errorText.substring(0, 200)}`);
      if (attempt < maxRetries - 1) {
        const waitTime = 5000 * (attempt + 1);
        await new Promise(r => setTimeout(r, waitTime));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏱️ Madlan-Jina attempt ${attempt + 1} timeout`);
      } else {
        console.error(`❌ Madlan-Jina attempt ${attempt + 1} error:`, error);
      }
      if (attempt < maxRetries - 1) {
        const waitTime = 5000 * (attempt + 1);
        await new Promise(r => setTimeout(r, waitTime));
      }
    }
  }
  console.error(`❌ All attempts failed for ${url}`);
  return null;
}
import { saveProperty } from "../_shared/property-helpers.ts";
import { parseMadlanMarkdown } from "../_experimental/parser-madlan.ts";
import { updatePageStatus, incrementRunStats, checkAndFinalizeRun, isRunStopped } from "../_shared/run-helpers.ts";

/**
 * Edge Function for scraping Madlan using Jina Reader - SEQUENTIAL MODE
 * Clone of scout-madlan with Firecrawl replaced by Jina.
 */

const MADLAN_CONFIG = {
  SOURCE: 'madlan',
  MAX_RETRIES: 3,
  NEXT_PAGE_DELAY: 15000,  // 15s between pages to avoid bot detection
  RECOVERY_DELAY: 15000,
};

async function triggerNextPage(
  supabaseUrl: string, supabaseServiceKey: string, configId: string,
  nextPage: number, runId: string, maxPages: number, startPage: number,
  isRetry = false, retryPages: number[] = [], _skipCount = 0
): Promise<boolean> {
  const MAX_TRIGGER_RETRIES = 3;
  const TRIGGER_RETRY_DELAY = 5000;
  const MAX_CONSECUTIVE_SKIPS = 3;

  for (let attempt = 1; attempt <= MAX_TRIGGER_RETRIES; attempt++) {
    console.log(`📄 Madlan-Jina: triggering page ${nextPage}/${maxPages} (attempt ${attempt})${isRetry ? ' [RETRY]' : ''}`);
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/scout-madlan-jina`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({ config_id: configId, page: nextPage, run_id: runId, max_pages: maxPages, start_page: startPage, is_retry: isRetry, retry_pages: retryPages })
      });
      try { await resp.text(); } catch {}
      return true;
    } catch (error) {
      console.error(`Error triggering Madlan-Jina page ${nextPage} (attempt ${attempt}):`, error);
      if (attempt < MAX_TRIGGER_RETRIES) await new Promise(r => setTimeout(r, TRIGGER_RETRY_DELAY));
    }
  }

  if (_skipCount < MAX_CONSECUTIVE_SKIPS) {
    console.warn(`⏭️ Madlan-Jina: skipping page ${nextPage} (skip ${_skipCount + 1})`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await updatePageStatus(supabase, runId, nextPage, { status: 'failed', error: `trigger_failed`, duration_ms: 0 });

    if (isRetry && retryPages.length > 0) {
      return triggerNextPage(supabaseUrl, supabaseServiceKey, configId, retryPages[0], runId, maxPages, startPage, true, retryPages.slice(1), _skipCount + 1);
    } else if (!isRetry && nextPage < maxPages) {
      return triggerNextPage(supabaseUrl, supabaseServiceKey, configId, nextPage + 1, runId, maxPages, startPage, false, [], _skipCount + 1);
    } else {
      await checkAndFinalizeRun(supabase, runId, maxPages - startPage + 1, 'madlan-jina');
    }
  } else {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await checkAndFinalizeRun(supabase, runId, maxPages - startPage + 1, 'madlan-jina');
  }
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.json().catch(() => ({}));
  const page = body.page as number | undefined;
  const runId = body.run_id as string | undefined;
  const configId = body.config_id as string | undefined;
  const maxPages = body.max_pages as number | undefined;
  const startPage = body.start_page as number || 1;
  const isRetry = body.is_retry as boolean || false;
  const retryPages = body.retry_pages as number[] || [];

  if (page == null || !runId || !configId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required params' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const pageStartTime = Date.now();
  console.log(`🔵 scout-madlan-jina: Page ${page} for run ${runId}`);

  try {
    if (await isRunStopped(supabase, runId)) {
      return new Response(JSON.stringify({ success: false, reason: 'stopped' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: config, error: configError } = await supabase.from('scout_configs').select('*').eq('id', configId).single();
    if (configError || !config) throw new Error('Config not found');

    await updatePageStatus(supabase, runId, page, { status: 'scraping' });

    const urls = buildSinglePageUrl(config, page);
    if (!urls.length) {
      await updatePageStatus(supabase, runId, page, { status: 'failed', error: 'Failed to build URL', duration_ms: Date.now() - pageStartTime });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages - startPage + 1, 'madlan-jina');
      return new Response(JSON.stringify({ success: false, error: 'No URL' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = urls[0];
    console.log(`🔵 Madlan-Jina page ${page}: Scraping ${url}`);
    await updatePageStatus(supabase, runId, page, { url });

    const scrapeResult = await scrapeMadlanWithJina(url, MADLAN_CONFIG.MAX_RETRIES);

    if (!scrapeResult) {
      await updatePageStatus(supabase, runId, page, { status: 'blocked', error: 'Scrape failed', duration_ms: Date.now() - pageStartTime });
      let willChainOnFail = false;
      const { data: runCheck } = await supabase.from('scout_runs').select('status').eq('id', runId).single();
      if (runCheck?.status !== 'stopped') {
        if (isRetry && retryPages.length > 0) {
          willChainOnFail = true;
          await new Promise(r => setTimeout(r, MADLAN_CONFIG.RECOVERY_DELAY));
          await triggerNextPage(supabaseUrl, supabaseServiceKey, configId, retryPages[0], runId, maxPages!, startPage, true, retryPages.slice(1));
        } else if (!isRetry && maxPages && page < maxPages) {
          willChainOnFail = true;
          await new Promise(r => setTimeout(r, MADLAN_CONFIG.RECOVERY_DELAY));
          await triggerNextPage(supabaseUrl, supabaseServiceKey, configId, page + 1, runId, maxPages, startPage);
        }
      }
      if (!willChainOnFail) {
        await checkAndFinalizeRun(supabase, runId, maxPages! - startPage + 1, 'madlan-jina');
      }
      return new Response(JSON.stringify({ success: false, error: 'Scrape failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { markdown, html } = scrapeResult;
    const validation = validateScrapedContent(markdown, html, 'madlan');
    if (!validation.valid) {
      await updatePageStatus(supabase, runId, page, { status: 'blocked', error: validation.reason || 'Validation failed', duration_ms: Date.now() - pageStartTime });
      let willChainOnValidation = false;
      const { data: runCheck2 } = await supabase.from('scout_runs').select('status').eq('id', runId).single();
      if (runCheck2?.status !== 'stopped') {
        if (isRetry && retryPages.length > 0) {
          willChainOnValidation = true;
          await new Promise(r => setTimeout(r, MADLAN_CONFIG.RECOVERY_DELAY));
          await triggerNextPage(supabaseUrl, supabaseServiceKey, configId, retryPages[0], runId, maxPages!, startPage, true, retryPages.slice(1));
        } else if (!isRetry && maxPages && page < maxPages) {
          willChainOnValidation = true;
          await new Promise(r => setTimeout(r, MADLAN_CONFIG.RECOVERY_DELAY));
          await triggerNextPage(supabaseUrl, supabaseServiceKey, configId, page + 1, runId, maxPages, startPage);
        }
      }
      if (!willChainOnValidation) {
        await checkAndFinalizeRun(supabase, runId, maxPages! - startPage + 1, 'madlan-jina');
      }
      return new Response(JSON.stringify({ success: false, error: 'Validation failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const propertyTypeForParsing = config.property_type === 'both' ? 'rent' : config.property_type;
    const parseResult = parseMadlanMarkdown(markdown, propertyTypeForParsing, config.owner_type_filter);
    const extractedProperties = parseResult.properties;

    console.log(`🔵 Madlan-Jina page ${page}: Parsed ${extractedProperties.length} properties`);

    if (markdown.length > 1000 && extractedProperties.length > 0) {
      try {
        await supabase.from('debug_scrape_samples').upsert({
          source: 'madlan', url, html: html?.substring(0, 100000) || null,
          markdown: markdown?.substring(0, 100000) || null,
          properties_found: extractedProperties.length, updated_at: new Date().toISOString()
        }, { onConflict: 'source' });
      } catch (debugErr) { console.warn('Failed to save debug sample:', debugErr); }
    }

    let pageNew = 0;
    let pageUpdated = 0;
    for (const property of extractedProperties) {
      const result = await saveProperty(supabase, property);
      if (result.isNew) pageNew++;
      else if (!result.skipped) pageUpdated++;
    }

    const duration = Date.now() - pageStartTime;
    await updatePageStatus(supabase, runId, page, { status: 'completed', found: extractedProperties.length, new: pageNew, duration_ms: duration });
    await incrementRunStats(supabase, runId, extractedProperties.length, pageNew);

    const { data: runCheck } = await supabase.from('scout_runs').select('status').eq('id', runId).single();
    let willChain = false;
    if (runCheck?.status !== 'stopped') {
      if (isRetry && retryPages.length > 0) {
        willChain = true;
        await new Promise(r => setTimeout(r, MADLAN_CONFIG.NEXT_PAGE_DELAY));
        await triggerNextPage(supabaseUrl, supabaseServiceKey, configId, retryPages[0], runId, maxPages!, startPage, true, retryPages.slice(1));
      } else if (!isRetry && maxPages && page < maxPages) {
        willChain = true;
        await new Promise(r => setTimeout(r, MADLAN_CONFIG.NEXT_PAGE_DELAY));
        await triggerNextPage(supabaseUrl, supabaseServiceKey, configId, page + 1, runId, maxPages, startPage);
      }
    }
    // Only finalize when no more chaining will happen
    if (!willChain) {
      await checkAndFinalizeRun(supabase, runId, maxPages! - startPage + 1, 'madlan-jina');
    }

    console.log(`📊 Madlan-Jina page ${page} DONE: new=${pageNew} updated=${pageUpdated} | ${duration}ms`);

    return new Response(JSON.stringify({
      success: true, page, found: extractedProperties.length, new: pageNew, duration_ms: duration, parser: 'no-ai'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(`scout-madlan-jina page ${page} error:`, error);
    await updatePageStatus(supabase, runId, page, { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error', duration_ms: Date.now() - pageStartTime });
    await checkAndFinalizeRun(supabase, runId, maxPages! - startPage + 1, 'madlan-jina');
    return new Response(JSON.stringify({ success: false, page, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
