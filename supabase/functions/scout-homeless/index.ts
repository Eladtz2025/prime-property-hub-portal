import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, scrapeWithRetry, validateScrapedContent } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";
import { saveProperty } from "../_shared/property-helpers.ts";
import { parseHomelessHtml } from "../_experimental/parser-homeless.ts";
import { updatePageStatus, incrementRunStats, checkAndFinalizeRun, isRunStopped } from "../_shared/run-helpers.ts";

/**
 * Edge Function for scraping Homeless - SINGLE PAGE MODE ONLY
 * Each invocation handles exactly one page.
 * Uses NON-AI parser for cost-free extraction.
 */

const HOMELESS_CONFIG = {
  SOURCE: 'homeless',
  WAIT_FOR_MS: 10000, // Longer wait to let Cloudflare JS challenge resolve
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
  console.log(`🟣 scout-homeless [NO-AI]: Page ${page} for run ${runId}`);

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
        await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless');
      }
      
      return new Response(JSON.stringify({ success: false, error: 'No URL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = urls[0];
    console.log(`🟣 Homeless page ${page}: Scraping ${url}`);
    await updatePageStatus(supabase, runId, page, { url });

    // Check API keys
    if (!firecrawlApiKey) {
      await updatePageStatus(supabase, runId, page, { 
        status: 'failed', 
        error: 'FIRECRAWL_API_KEY not configured',
        duration_ms: Date.now() - pageStartTime
      });
      
      if (maxPages) {
        await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless');
      }
      
      return new Response(JSON.stringify({ success: false, error: 'No API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Scrape the page
    const scrapeData = await scrapeWithRetry(url, firecrawlApiKey, 'homeless', HOMELESS_CONFIG.MAX_RETRIES, HOMELESS_CONFIG.WAIT_FOR_MS);
    
    if (!scrapeData) {
      console.error(`All retry attempts failed for Homeless page ${page}`);
      await updatePageStatus(supabase, runId, page, { 
        status: 'blocked', 
        error: 'Scrape failed - possible CAPTCHA',
        duration_ms: Date.now() - pageStartTime
      });
      
      if (maxPages) {
        await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless');
      }
      
      return new Response(JSON.stringify({ success: false, error: 'Scrape failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const html = scrapeData.data?.html || scrapeData.html || '';

    // Save debug sample for diagnosis
    await supabase.from('debug_scrape_samples').upsert({
      source: 'homeless',
      url: url,
      html: html.substring(0, 50000),
      markdown: markdown.substring(0, 10000),
      properties_found: 0,
    }, { onConflict: 'source' }).then(() => console.log('Debug sample saved'));

    const validation = validateScrapedContent(markdown, html, 'homeless');
    if (!validation.valid) {
      console.error(`Homeless content validation failed: ${validation.reason}`);
      await updatePageStatus(supabase, runId, page, { 
        status: 'blocked', 
        error: validation.reason || 'Content validation failed',
        duration_ms: Date.now() - pageStartTime
      });
      
      if (maxPages) {
        await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless');
      }
      
      return new Response(JSON.stringify({ success: false, error: 'Validation failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract properties with NON-AI parser (uses HTML) + DB street lookup
    const propertyTypeForParsing = config.property_type === 'both' ? 'rent' : config.property_type;
    const parseResult = await parseHomelessHtml(html, propertyTypeForParsing, supabase);
    const extractedProperties = parseResult.properties;

    console.log(`🟣 Homeless page ${page}: [NO-AI] Parsed ${extractedProperties.length} properties (${parseResult.stats.private_count} private)`);

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

    // Check if all pages are done and finalize
    if (maxPages) {
      await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless');
    }

    return new Response(JSON.stringify({
      success: true,
      page,
      found: extractedProperties.length,
      new: pageNew,
      duration_ms: duration,
      parser: 'no-ai'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`scout-homeless page ${page} error:`, error);
    
    await updatePageStatus(supabase, runId, page, { 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - pageStartTime
    });

    if (maxPages) {
      await checkAndFinalizeRun(supabase, runId, maxPages, 'homeless');
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
