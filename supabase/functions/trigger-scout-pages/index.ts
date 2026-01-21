import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { fetchScoutSettings } from '../_shared/settings.ts';

/**
 * Unified Trigger for all Scout sources
 * Routes to the appropriate source-specific function (scout-yad2, scout-madlan, scout-homeless)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      .select('id, name, source, max_pages')
      .eq('id', config_id)
      .single();

    if (configError || !config) {
      console.error('❌ Config not found:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Config not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 Trigger Scout Pages - Config: ${config.name} (${config.source})`);

    // Fetch settings to get pages per source
    const settings = await fetchScoutSettings(supabase);
    
    // Determine pages to scan based on source from settings or config
    let pagesToScan: number;
    switch (config.source) {
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

    // Determine target function based on source
    const targetFunction = `scout-${config.source}`;

    // For Yad2, use trigger-yad2-pages style (page-by-page with run record)
    if (config.source === 'yad2') {
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

      // Create a single run record for all pages
      const initialPageStats = Array.from({ length: pagesToScan }, (_, i) => ({
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
          config_id: config_id,
          source: 'yad2',
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

      console.log(`🟠 Created run ${runData.id} for ${pagesToScan} Yad2 pages`);

      // Trigger each page as a separate function call with delays
      const triggerPromises: Promise<void>[] = [];
      
      for (let page = 1; page <= pagesToScan; page++) {
        const delayMs = (page - 1) * 3000; // 3 second delay between page starts
        
        const triggerPage = async () => {
          // Wait for the delay
          await new Promise(resolve => setTimeout(resolve, delayMs));
          
          // Check if run was stopped before triggering
          const { data: runCheck } = await supabase
            .from('scout_runs')
            .select('status')
            .eq('id', runData.id)
            .single();
          
          if (runCheck?.status === 'stopped') {
            console.log(`🛑 Run ${runData.id} was stopped, skipping page ${page}`);
            return;
          }

          console.log(`🟠 Triggering page ${page}/${pagesToScan} for run ${runData.id}`);
          
          try {
            await fetch(`${supabaseUrl}/functions/v1/scout-yad2`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`
              },
              body: JSON.stringify({
                config_id: config_id,
                page: page,
                run_id: runData.id,
                max_pages: pagesToScan
              })
            });
          } catch (error) {
            console.error(`Error triggering page ${page}:`, error);
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
        run_id: runData.id,
        pages_triggered: pagesToScan,
        message: `Started scraping ${pagesToScan} pages for ${config.name}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For Madlan and Homeless - call directly (they handle their own pagination)
    console.log(`📄 Triggering ${targetFunction} for: ${config.name}`);

    fetch(`${supabaseUrl}/functions/v1/${targetFunction}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config_id: config.id }),
    }).catch(err => {
      console.error(`❌ Failed to trigger ${targetFunction}:`, err);
    });

    return new Response(
      JSON.stringify({
        success: true,
        config: config.name,
        source: config.source,
        target_function: targetFunction,
        pages_to_scan: pagesToScan,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Trigger Scout Pages failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
