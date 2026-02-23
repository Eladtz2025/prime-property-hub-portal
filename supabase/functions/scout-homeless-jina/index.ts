import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateScrapedContent } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";

interface JinaScrapeResult { markdown: string; html: string; }

async function scrapeHomelessWithJina(url: string, maxRetries = 2, timeoutSeconds = 30): Promise<JinaScrapeResult | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      console.log(`🌐 Homeless-Jina scrape attempt ${attempt + 1}/${maxRetries} for ${url}`);

      const response = await fetch(`https://r.jina.ai/${url}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'X-Return-Format': 'html',
          'X-No-Cache': 'true',
          'X-Wait-For-Selector': 'body',
          'X-Timeout': String(timeoutSeconds),
          'X-Locale': 'he-IL',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const body = await response.text();
        console.log(`✅ Homeless-Jina scrape successful (${body.length} chars)`);
        return { markdown: '', html: body };
      }

      const errorText = await response.text();
      console.warn(`⚠️ Homeless-Jina attempt ${attempt + 1} failed, status: ${response.status}, error: ${errorText.substring(0, 200)}`);
      if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏱️ Homeless-Jina attempt ${attempt + 1} timeout`);
      } else {
        console.error(`❌ Homeless-Jina attempt ${attempt + 1} error:`, error);
      }
      if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  console.error(`❌ All ${maxRetries} Homeless-Jina attempts failed for ${url}`);
  return null;
}
import { saveProperty } from "../_shared/property-helpers.ts";
import { parseHomelessHtml } from "../_experimental/parser-homeless.ts";
import { updatePageStatus, incrementRunStats, checkAndFinalizeRun, isRunStopped } from "../_shared/run-helpers.ts";

/**
 * Edge Function for scraping Homeless using Jina Reader - SINGLE PAGE MODE
 * Clone of scout-homeless with Firecrawl replaced by Jina.
 * Jina returns HTML via X-Return-Format: html for Cheerio parser compatibility.
 */

const HOMELESS_CONFIG = {
  SOURCE: 'homeless',
  MAX_RETRIES: 2,
};

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

  if (page == null || !runId || !configId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required params' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const pageStartTime = Date.now();
  console.log(`🟣 scout-homeless-jina: Page ${page} for run ${runId}`);

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
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless-jina');
      return new Response(JSON.stringify({ success: false, error: 'No URL' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = urls[0];
    console.log(`🟣 Homeless-Jina page ${page}: Scraping ${url}`);
    await updatePageStatus(supabase, runId, page, { url });

    // Jina returns HTML for homeless (via X-Return-Format: html in scraping-jina.ts)
    const timeoutSec = config.wait_for_ms ? Math.round(config.wait_for_ms / 1000) : 30;
    const scrapeResult = await scrapeHomelessWithJina(url, HOMELESS_CONFIG.MAX_RETRIES, timeoutSec);

    if (!scrapeResult) {
      await updatePageStatus(supabase, runId, page, { status: 'blocked', error: 'Scrape failed', duration_ms: Date.now() - pageStartTime });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless-jina');
      return new Response(JSON.stringify({ success: false, error: 'Scrape failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { markdown, html } = scrapeResult;

    // Save debug sample
    await supabase.from('debug_scrape_samples').upsert({
      source: 'homeless', url, html: html.substring(0, 50000),
      markdown: markdown.substring(0, 10000), properties_found: 0,
    }, { onConflict: 'source' }).then(() => console.log('Debug sample saved'));

    const validation = validateScrapedContent(markdown, html, 'homeless');
    if (!validation.valid) {
      await updatePageStatus(supabase, runId, page, { status: 'blocked', error: validation.reason || 'Validation failed', duration_ms: Date.now() - pageStartTime });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless-jina');
      return new Response(JSON.stringify({ success: false, error: 'Validation failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Parse HTML with Cheerio-based parser
    const propertyTypeForParsing = config.property_type === 'both' ? 'rent' : config.property_type;
    const parseResult = await parseHomelessHtml(html, propertyTypeForParsing, supabase, config.owner_type_filter);
    const extractedProperties = parseResult.properties;

    console.log(`🟣 Homeless-Jina page ${page}: Parsed ${extractedProperties.length} properties (${parseResult.stats.private_count} private)`);

    let pageNew = 0;
    for (const property of extractedProperties) {
      const result = await saveProperty(supabase, property);
      if (result.isNew) pageNew++;
    }

    const duration = Date.now() - pageStartTime;
    await updatePageStatus(supabase, runId, page, { status: 'completed', found: extractedProperties.length, new: pageNew, duration_ms: duration });
    await incrementRunStats(supabase, runId, extractedProperties.length, pageNew);
    if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless-jina');

    return new Response(JSON.stringify({
      success: true, page, found: extractedProperties.length, new: pageNew, duration_ms: duration, parser: 'no-ai'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(`scout-homeless-jina page ${page} error:`, error);
    await updatePageStatus(supabase, runId, page, { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error', duration_ms: Date.now() - pageStartTime });
    if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless-jina');
    return new Response(JSON.stringify({ success: false, page, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
