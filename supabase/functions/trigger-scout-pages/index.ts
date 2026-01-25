import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { fetchScoutSettings } from '../_shared/settings.ts';
import { createInitialPageStats } from '../_shared/run-helpers.ts';

/**
 * Unified Trigger for all Scout sources
 * Creates a run record and triggers individual page scrapes with delays.
 * All sources (yad2, madlan, homeless) use the same single-page architecture.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Source-specific delays between page triggers (in milliseconds)
// Madlan needs longer delays to avoid CAPTCHA blocks (90% block rate with short delays)
const SOURCE_DELAYS: Record<string, number> = {
  yad2: 3000,      // 3 seconds between Yad2 pages
  madlan: 20000,   // 20 seconds for Madlan (increased from 5s to avoid CAPTCHA)
  homeless: 2000,  // 2 seconds for Homeless
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { config_id } = await req.json();

    if (!config_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'config_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the config to determine source
    const { data: config, error: configError } = await supabase
      .from('scout_configs')
      .select('id, name, source, max_pages, page_delay_seconds')
      .eq('id', config_id)
      .single();

    if (configError || !config) {
      console.error('❌ Config not found:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Config not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const source = config.source as string;
    console.log(`🚀 Trigger Scout Pages - Config: ${config.name} (${source})`);

    // Fetch settings to get pages per source
    const settings = await fetchScoutSettings(supabase);
    
    // Determine pages to scan based on source from settings or config
    let pagesToScan: number;
    switch (source) {
      case 'yad2':
        pagesToScan = config.max_pages ?? settings.scraping.yad2_pages ?? 4;
        break;
      case 'madlan':
        pagesToScan = config.max_pages ?? settings.scraping.madlan_pages ?? 15;
        break;
      case 'homeless':
        pagesToScan = config.max_pages ?? settings.scraping.homeless_pages ?? 5;
        break;
      default:
        pagesToScan = 5;
    }

    // Check for existing running job
    const { data: existingRun } = await supabase
      .from('scout_runs')
      .select('id')
      .eq('config_id', config_id)
      .eq('status', 'running')
      .single();

    if (existingRun) {
      return new Response(JSON.stringify({ 
        error: 'Config already has a running job',
        run_id: existingRun.id 
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a run record with initial page_stats
    const initialPageStats = createInitialPageStats(pagesToScan);

    const { data: runData, error: runError } = await supabase
      .from('scout_runs')
      .insert({
        config_id: config_id,
        source: source,
        status: 'running',
        properties_found: 0,
        new_properties: 0,
        page_stats: initialPageStats
      })
      .select()
      .single();

    if (runError) {
      console.error('Failed to create run record:', runError);
      return new Response(JSON.stringify({ error: 'Failed to create run' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const runId = runData.id;
    const targetFunction = `scout-${source}`;
    // Use config delay if set, otherwise fall back to source defaults
    const delayMs = config.page_delay_seconds 
      ? config.page_delay_seconds * 1000 
      : SOURCE_DELAYS[source] || 5000;

    console.log(`📄 Created run ${runId} for ${pagesToScan} ${source} pages (delay: ${delayMs}ms)`);

    // Trigger each page as a separate function call with delays
    const triggerPromises: Promise<void>[] = [];
    
    for (let page = 1; page <= pagesToScan; page++) {
      const pageDelay = (page - 1) * delayMs;
      
      const triggerPage = async () => {
        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, pageDelay));
        
        // Check if run was stopped before triggering
        const { data: runCheck } = await supabase
          .from('scout_runs')
          .select('status')
          .eq('id', runId)
          .single();
        
        if (runCheck?.status === 'stopped') {
          console.log(`🛑 Run ${runId} was stopped, skipping page ${page}`);
          return;
        }

        console.log(`📄 Triggering ${source} page ${page}/${pagesToScan} for run ${runId}`);
        
        try {
          await fetch(`${supabaseUrl}/functions/v1/${targetFunction}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              config_id: config_id,
              page: page,
              run_id: runId,
              max_pages: pagesToScan
            })
          });
        } catch (error) {
          console.error(`Error triggering ${source} page ${page}:`, error);
        }
      };

      triggerPromises.push(triggerPage());
    }

    // Start all page triggers (they will execute with their own delays)
    Promise.all(triggerPromises).catch(err => {
      console.error('Error in page triggers:', err);
    });

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      source: source,
      pages_triggered: pagesToScan,
      delay_ms: delayMs,
      message: `Started scraping ${pagesToScan} pages for ${config.name}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Trigger Scout Pages failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
