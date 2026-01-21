import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, scrapeWithRetry, validateScrapedContent } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";
import { fetchScoutSettings } from "../_shared/settings.ts";
import { ScrapedProperty, saveProperty } from "../_shared/property-helpers.ts";
import { extractPropertiesWithAI } from "../_shared/ai-extraction.ts";

/**
 * Edge Function for scraping Yad2
 * Supports two modes:
 * 1. Single page mode: when `page` and `run_id` are provided
 * 2. Full scan mode: scrapes all pages in sequence (legacy)
 */

// Yad2-specific configuration
const YAD2_CONFIG = {
  SOURCE: 'yad2',
  MAX_PAGES: 4,
  PAGE_DELAY_MS: 15000,
  WAIT_FOR_MS: 5000,
  MAX_RETRIES: 2
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

  // Parse request body for single-page mode
  const body = await req.json().catch(() => ({}));
  const singlePage = body.page as number | undefined;
  const existingRunId = body.run_id as string | undefined;
  const requestedConfigId = body.config_id as string | undefined;
  const maxPagesFromTrigger = body.max_pages as number | undefined;

  // Single page mode
  if (singlePage && existingRunId && requestedConfigId) {
    return await handleSinglePageScrape(
      supabase, 
      requestedConfigId, 
      singlePage, 
      existingRunId, 
      maxPagesFromTrigger || YAD2_CONFIG.MAX_PAGES,
      firecrawlApiKey, 
      lovableApiKey
    );
  }

  // Full scan mode (legacy - loops through all pages)
  return await handleFullScan(supabase, firecrawlApiKey, lovableApiKey);
});

/**
 * Handle single page scraping - called by trigger-yad2-pages
 */
async function handleSinglePageScrape(
  supabase: any,
  configId: string,
  page: number,
  runId: string,
  maxPages: number,
  firecrawlApiKey?: string,
  lovableApiKey?: string
): Promise<Response> {
  const pageStartTime = Date.now();
  
  console.log(`🟠 scout-yad2: Single page mode - Page ${page} for run ${runId}`);

  try {
    // Check if run was stopped
    const { data: runCheck } = await supabase
      .from('scout_runs')
      .select('status')
      .eq('id', runId)
      .single();
    
    if (runCheck?.status === 'stopped') {
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
      return new Response(JSON.stringify({ success: false, error: 'No URL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = urls[0];
    console.log(`🟠 Yad2 page ${page}: Scraping ${url}`);

    await updatePageStatus(supabase, runId, page, { url });

    if (!firecrawlApiKey) {
      await updatePageStatus(supabase, runId, page, { 
        status: 'failed', 
        error: 'FIRECRAWL_API_KEY not configured',
        duration_ms: Date.now() - pageStartTime
      });
      return new Response(JSON.stringify({ success: false, error: 'No API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Scrape the page
    const scrapeData = await scrapeWithRetry(url, firecrawlApiKey, 'yad2', YAD2_CONFIG.MAX_RETRIES);
    
    if (!scrapeData) {
      console.error(`All retry attempts failed for Yad2 page ${page}`);
      await updatePageStatus(supabase, runId, page, { 
        status: 'blocked', 
        error: 'Scrape failed - possible CAPTCHA',
        duration_ms: Date.now() - pageStartTime
      });
      
      await checkAndFinalizeRun(supabase, runId, maxPages);
      
      return new Response(JSON.stringify({ success: false, error: 'Scrape failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const html = scrapeData.data?.html || scrapeData.html || '';

    const validation = validateScrapedContent(markdown, html, 'yad2');
    if (!validation.valid) {
      console.error(`Yad2 content validation failed: ${validation.reason}`);
      await updatePageStatus(supabase, runId, page, { 
        status: 'blocked', 
        error: validation.reason || 'Content validation failed',
        duration_ms: Date.now() - pageStartTime
      });
      
      await checkAndFinalizeRun(supabase, runId, maxPages);
      
      return new Response(JSON.stringify({ success: false, error: 'Validation failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!lovableApiKey) {
      await updatePageStatus(supabase, runId, page, { 
        status: 'failed', 
        error: 'LOVABLE_API_KEY not configured',
        duration_ms: Date.now() - pageStartTime
      });
      return new Response(JSON.stringify({ success: false, error: 'No AI key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract properties with AI (using shared function)
    const extractedProperties = await extractPropertiesWithAI(
      markdown, html, url, 'yad2',
      config.property_type === 'both' ? 'rent' : config.property_type,
      lovableApiKey, config.cities
    );

    console.log(`🟠 Yad2 page ${page}: Extracted ${extractedProperties.length} properties`);

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

    // Update run totals
    await supabase.rpc('increment_scout_run_stats', {
      p_run_id: runId,
      p_found: extractedProperties.length,
      p_new: pageNew
    }).catch(async () => {
      // Fallback if RPC doesn't exist - direct update
      const { data: currentRun } = await supabase
        .from('scout_runs')
        .select('properties_found, new_properties')
        .eq('id', runId)
        .single();
      
      if (currentRun) {
        await supabase
          .from('scout_runs')
          .update({
            properties_found: (currentRun.properties_found || 0) + extractedProperties.length,
            new_properties: (currentRun.new_properties || 0) + pageNew
          })
          .eq('id', runId);
      }
    });

    // Check if all pages are done
    await checkAndFinalizeRun(supabase, runId, maxPages);

    return new Response(JSON.stringify({
      success: true,
      page,
      found: extractedProperties.length,
      new: pageNew,
      duration_ms: duration
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

    await checkAndFinalizeRun(supabase, runId, maxPages);

    return new Response(JSON.stringify({
      success: false,
      page,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Update the status of a specific page in page_stats
 */
async function updatePageStatus(
  supabase: any, 
  runId: string, 
  page: number, 
  updates: { 
    status?: string; 
    url?: string;
    found?: number; 
    new?: number; 
    duration_ms?: number;
    error?: string;
  }
) {
  const { data: run } = await supabase
    .from('scout_runs')
    .select('page_stats')
    .eq('id', runId)
    .single();

  if (!run?.page_stats) return;

  const pageStats = [...run.page_stats];
  const pageIndex = page - 1;
  
  if (pageIndex >= 0 && pageIndex < pageStats.length) {
    pageStats[pageIndex] = {
      ...pageStats[pageIndex],
      ...updates
    };

    await supabase
      .from('scout_runs')
      .update({ page_stats: pageStats })
      .eq('id', runId);
  }
}

/**
 * Check if all pages are done and finalize the run
 */
async function checkAndFinalizeRun(supabase: any, runId: string, maxPages: number) {
  const { data: run } = await supabase
    .from('scout_runs')
    .select('page_stats, status, config_id, properties_found')
    .eq('id', runId)
    .single();

  if (!run || run.status !== 'running') return;

  const pageStats = run.page_stats || [];
  const completedPages = pageStats.filter((p: any) => 
    p.status === 'completed' || p.status === 'failed' || p.status === 'blocked'
  ).length;

  // Check if all pages are done
  if (completedPages >= maxPages) {
    const hasErrors = pageStats.some((p: any) => p.status === 'failed' || p.status === 'blocked');
    const finalStatus = hasErrors ? 'partial' : 'completed';

    await supabase
      .from('scout_runs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', runId);

    // Update config last run
    if (run.config_id) {
      await supabase
        .from('scout_configs')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: finalStatus,
          last_run_results: { properties_found: run.properties_found || 0 }
        })
        .eq('id', run.config_id);
    }

    console.log(`✅ Run ${runId} finalized with status: ${finalStatus}`);
  }
}

/**
 * Handle full scan mode (legacy - all pages in sequence)
 */
async function handleFullScan(
  supabase: any,
  firecrawlApiKey?: string,
  lovableApiKey?: string
): Promise<Response> {
  const settings = await fetchScoutSettings(supabase);
  
  console.log(`🟠 scout-yad2: Starting full scan mode`);

  let runId: string | undefined;

  try {
    const { data: configs, error: configError } = await supabase
      .from('scout_configs')
      .select('*')
      .eq('is_active', true)
      .eq('source', 'yad2');

    if (configError) throw configError;

    if (!configs || configs.length === 0) {
      console.log('No active Yad2 configurations found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active Yad2 configurations',
        properties_found: 0,
        new_properties: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let totalPropertiesFound = 0;
    let totalNewProperties = 0;

    for (const config of configs) {
      const configMaxPages = config.max_pages ?? settings.scraping.yad2_pages ?? YAD2_CONFIG.MAX_PAGES;
      const configPageDelay = (config.page_delay_seconds ?? YAD2_CONFIG.PAGE_DELAY_MS / 1000) * 1000;

      console.log(`Processing Yad2 config: ${config.name} (pages: ${configMaxPages})`);

      const { data: existingRun } = await supabase
        .from('scout_runs')
        .select('id')
        .eq('config_id', config.id)
        .eq('status', 'running')
        .single();

      if (existingRun) {
        console.log(`⏭️ Config ${config.name} already has a running job, skipping`);
        continue;
      }

      const initialPageStats = Array.from({ length: configMaxPages }, (_, i) => ({
        page: i + 1,
        url: '',
        status: 'pending',
        found: 0,
        new: 0,
        duration_ms: 0
      }));

      const { data: runData, error: runError } = await supabase
        .from('scout_runs')
        .insert({
          config_id: config.id,
          source: 'yad2',
          status: 'running',
          page_stats: initialPageStats
        })
        .select()
        .single();

      if (runError) {
        console.error('Failed to create run record:', runError);
        continue;
      }
      runId = runData.id;

      let configPropertiesFound = 0;
      let configNewProperties = 0;

      for (let page = 1; page <= configMaxPages; page++) {
        const { data: runCheck } = await supabase
          .from('scout_runs')
          .select('status')
          .eq('id', runId)
          .single();
        
        if (runCheck?.status === 'stopped') {
          console.log(`🛑 Yad2 run ${runId} was stopped, exiting loop`);
          break;
        }

        const urls = buildSinglePageUrl(config, page);
        if (!urls.length) continue;

        const url = urls[0];
        const pageStartTime = Date.now();
        console.log(`🟠 Yad2: Scraping page ${page}/${configMaxPages}: ${url}`);

        await updatePageStatus(supabase, runId, page, { status: 'scraping', url });

        if (page > 1) {
          const delay = configPageDelay + Math.random() * 2000;
          console.log(`Waiting ${Math.round(delay)}ms before next Yad2 page...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        let pageFound = 0;
        let pageNew = 0;

        try {
          if (!firecrawlApiKey) {
            console.warn('FIRECRAWL_API_KEY not configured');
            break;
          }

          const scrapeData = await scrapeWithRetry(url, firecrawlApiKey, 'yad2', YAD2_CONFIG.MAX_RETRIES);
          
          if (!scrapeData) {
            console.error(`All retry attempts failed for Yad2 page ${page}`);
            await updatePageStatus(supabase, runId, page, { 
              status: 'blocked', 
              error: 'Scrape failed',
              duration_ms: Date.now() - pageStartTime
            });
            continue;
          }

          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          const html = scrapeData.data?.html || scrapeData.html || '';

          const validation = validateScrapedContent(markdown, html, 'yad2');
          if (!validation.valid) {
            console.error(`Yad2 content validation failed: ${validation.reason}`);
            await updatePageStatus(supabase, runId, page, { 
              status: 'blocked', 
              error: validation.reason || 'Validation failed',
              duration_ms: Date.now() - pageStartTime
            });
            continue;
          }

          if (!lovableApiKey) {
            console.warn('LOVABLE_API_KEY not configured');
            break;
          }

          const extractedProperties = await extractPropertiesWithAI(
            markdown, html, url, 'yad2',
            config.property_type === 'both' ? 'rent' : config.property_type,
            lovableApiKey, config.cities
          );

          console.log(`🟠 Yad2 page ${page}: Extracted ${extractedProperties.length} properties`);
          pageFound = extractedProperties.length;

          for (const property of extractedProperties) {
            const result = await saveProperty(supabase, property);
            if (result.isNew) {
              pageNew++;
              configNewProperties++;
              totalNewProperties++;
            }
          }

          configPropertiesFound += extractedProperties.length;
          totalPropertiesFound += extractedProperties.length;

          await updatePageStatus(supabase, runId, page, { 
            status: 'completed',
            found: pageFound,
            new: pageNew,
            duration_ms: Date.now() - pageStartTime
          });

        } catch (error) {
          console.error(`Error on Yad2 page ${page}:`, error);
          await updatePageStatus(supabase, runId, page, { 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration_ms: Date.now() - pageStartTime
          });
        }

        await supabase
          .from('scout_runs')
          .update({
            properties_found: configPropertiesFound,
            new_properties: configNewProperties
          })
          .eq('id', runId);
      }

      const { data: finalRunCheck } = await supabase
        .from('scout_runs')
        .select('status, page_stats')
        .eq('id', runId)
        .single();
      
      if (finalRunCheck?.status === 'running') {
        const hasErrors = finalRunCheck.page_stats?.some((p: any) => 
          p.status === 'failed' || p.status === 'blocked'
        );
        
        await supabase
          .from('scout_runs')
          .update({
            status: hasErrors ? 'partial' : 'completed',
            properties_found: configPropertiesFound,
            new_properties: configNewProperties,
            completed_at: new Date().toISOString()
          })
          .eq('id', runId);
      }

      await supabase
        .from('scout_configs')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'completed',
          last_run_results: { properties_found: configPropertiesFound }
        })
        .eq('id', config.id);

      console.log(`✅ Yad2 config ${config.name}: ${configPropertiesFound} found, ${configNewProperties} new`);
    }

    return new Response(JSON.stringify({
      success: true,
      source: 'yad2',
      properties_found: totalPropertiesFound,
      new_properties: totalNewProperties
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('scout-yad2 error:', error);
    
    if (runId) {
      await supabase
        .from('scout_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', runId);
    }

    return new Response(JSON.stringify({
      success: false,
      source: 'yad2',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
