import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateScrapedContent, scrapeWithRetry } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";
import { fetchScoutSettings } from "../_shared/settings.ts";
import { ScrapedProperty, saveProperty } from "../_shared/property-helpers.ts";
import { extractPropertiesWithAI } from "../_shared/ai-extraction.ts";

/**
 * Standalone Edge Function for scraping Madlan ONLY
 * Runs independently with Madlan-specific configuration
 */

// Madlan-specific configuration
const MADLAN_CONFIG = {
  SOURCE: 'madlan',
  MAX_PAGES: 15,
  PAGE_DELAY_MS: 5000,
  EXTRA_DELAY_MS: 3000,
  WAIT_FOR_MS: 8000,
  MAX_RETRIES: 3
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

  // Fetch settings for override values
  const settings = await fetchScoutSettings(supabase);
  const maxPages = settings.scraping.madlan_pages || MADLAN_CONFIG.MAX_PAGES;
  
  console.log(`🔵 scout-madlan: Starting with ${maxPages} pages max`);

  let runId: string | undefined;

  try {
    // Get only Madlan configs
    const { data: configs, error: configError } = await supabase
      .from('scout_configs')
      .select('*')
      .eq('is_active', true)
      .eq('source', 'madlan');

    if (configError) throw configError;

    if (!configs || configs.length === 0) {
      console.log('No active Madlan configurations found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active Madlan configurations',
        properties_found: 0,
        new_properties: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let totalPropertiesFound = 0;
    let totalNewProperties = 0;

    for (const config of configs) {
      // Get config-specific parameters with fallback chain: config -> settings -> default
      const configMaxPages = config.max_pages ?? settings.scraping.madlan_pages ?? MADLAN_CONFIG.MAX_PAGES;
      const configPageDelay = (config.page_delay_seconds ?? MADLAN_CONFIG.PAGE_DELAY_MS / 1000) * 1000;
      const configWaitFor = config.wait_for_ms ?? MADLAN_CONFIG.WAIT_FOR_MS;
      
      console.log(`Processing Madlan config: ${config.name} (pages: ${configMaxPages}, delay: ${configPageDelay}ms, wait: ${configWaitFor}ms)`);

      // Check for existing running job
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

      // Create run record
      const { data: runData, error: runError } = await supabase
        .from('scout_runs')
        .insert({
          config_id: config.id,
          source: 'madlan',
          status: 'running'
        })
        .select()
        .single();

      if (runError) {
        console.error('Failed to create run record:', runError);
        continue;
      }
      runId = runData.id;
      console.log(`Created run ${runId} for Madlan`);

      let configPropertiesFound = 0;
      let configNewProperties = 0;
      const pageStats: Array<{ page: number; url: string; found: number; new: number; duration_ms: number }> = [];

      for (let page = 1; page <= configMaxPages; page++) {
        // Check if run was stopped
        const { data: runCheck } = await supabase
          .from('scout_runs')
          .select('status')
          .eq('id', runId)
          .single();
        
        if (runCheck?.status === 'stopped') {
          console.log(`🛑 Madlan run ${runId} was stopped, exiting loop`);
          break;
        }

        const urls = buildSinglePageUrl(config, page);
        if (!urls.length) continue;

        const url = urls[0];
        const pageStartTime = Date.now();
        console.log(`🔵 Madlan: Scraping page ${page}/${configMaxPages}: ${url}`);

        // Add delay between pages (not for first page)
        if (page > 1) {
          const delay = configPageDelay + Math.random() * 3000;
          console.log(`Waiting ${Math.round(delay)}ms before next Madlan page...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        let pageFound = 0;
        let pageNew = 0;

        try {
          if (!firecrawlApiKey) {
            console.warn('FIRECRAWL_API_KEY not configured');
            break;
          }

          // Use shared scrapeWithRetry with stealth proxy
          const scrapeData = await scrapeWithRetry(url, firecrawlApiKey, 'madlan', MADLAN_CONFIG.MAX_RETRIES, MADLAN_CONFIG.WAIT_FOR_MS);
          
          if (!scrapeData) {
            console.error(`All retry attempts failed for Madlan page ${page}`);
            pageStats.push({ page, url, found: 0, new: 0, duration_ms: Date.now() - pageStartTime });
            continue;
          }

          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          const html = scrapeData.data?.html || scrapeData.html || '';

          const validation = validateScrapedContent(markdown, html, 'madlan');
          if (!validation.valid) {
            console.error(`Madlan content validation failed: ${validation.reason}`);
            await supabase
              .from('scout_runs')
              .update({ status: 'partial', error_message: validation.reason })
              .eq('id', runId);
            pageStats.push({ page, url, found: 0, new: 0, duration_ms: Date.now() - pageStartTime });
            continue;
          }

          if (!lovableApiKey) {
            console.warn('LOVABLE_API_KEY not configured');
            break;
          }

          const extractedProperties = await extractPropertiesWithAI(
            markdown, html, url, 'madlan',
            config.property_type === 'both' ? 'rent' : config.property_type,
            lovableApiKey, config.cities
          );

          console.log(`🔵 Madlan page ${page}: Extracted ${extractedProperties.length} properties`);
          pageFound = extractedProperties.length;

          // Log warning if no properties
          if (extractedProperties.length === 0) {
            console.warn(`⚠️ Madlan page ${page}: 0 properties extracted`);
            console.warn(`   Markdown length: ${markdown?.length || 0} chars`);
          }

          // Save properties
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

          // Extra delay after Madlan pages to reduce CAPTCHA
          console.log(`Adding extra ${MADLAN_CONFIG.EXTRA_DELAY_MS}ms delay after Madlan page...`);
          await new Promise(r => setTimeout(r, MADLAN_CONFIG.EXTRA_DELAY_MS));

        } catch (error) {
          console.error(`Error on Madlan page ${page}:`, error);
        }

        // Record page stats
        pageStats.push({ page, url, found: pageFound, new: pageNew, duration_ms: Date.now() - pageStartTime });

        // Update progress with page stats
        await supabase
          .from('scout_runs')
          .update({
            properties_found: configPropertiesFound,
            new_properties: configNewProperties,
            page_stats: pageStats
          })
          .eq('id', runId);
      }

      // Complete run (only if not stopped)
      const { data: finalRunCheck } = await supabase
        .from('scout_runs')
        .select('status')
        .eq('id', runId)
        .single();
      
      if (finalRunCheck?.status !== 'stopped') {
        await supabase
          .from('scout_runs')
          .update({
            status: 'completed',
            properties_found: configPropertiesFound,
            new_properties: configNewProperties,
            page_stats: pageStats,
            completed_at: new Date().toISOString()
          })
          .eq('id', runId);
      }

      // Update config last run
      await supabase
        .from('scout_configs')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'completed',
          last_run_results: { properties_found: configPropertiesFound }
        })
        .eq('id', config.id);

      console.log(`✅ Madlan config ${config.name}: ${configPropertiesFound} found, ${configNewProperties} new`);
    }

    return new Response(JSON.stringify({
      success: true,
      source: 'madlan',
      properties_found: totalPropertiesFound,
      new_properties: totalNewProperties
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('scout-madlan error:', error);
    
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
      source: 'madlan',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

