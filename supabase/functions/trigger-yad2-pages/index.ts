import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Trigger function that orchestrates separate page-by-page scraping for Yad2
 * Creates a single scout_run and triggers independent calls for each page
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const configId = body.config_id;

    if (!configId) {
      return new Response(JSON.stringify({ error: 'config_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the config
    const { data: config, error: configError } = await supabase
      .from('scout_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: 'Config not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get max pages from config or settings
    const { data: settings } = await supabase
      .from('scout_settings')
      .select('setting_value')
      .eq('category', 'scraping')
      .eq('setting_key', 'yad2_pages')
      .single();

    const maxPages = config.max_pages ?? parseInt(settings?.setting_value || '4');

    // Check for existing running job
    const { data: existingRun } = await supabase
      .from('scout_runs')
      .select('id')
      .eq('config_id', configId)
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
    const initialPageStats = Array.from({ length: maxPages }, (_, i) => ({
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
        config_id: configId,
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

    console.log(`🟠 trigger-yad2-pages: Created run ${runData.id} for ${maxPages} pages`);

    // Trigger each page as a separate function call with delays
    // We use a fire-and-forget approach - don't wait for responses
    const triggerPromises: Promise<void>[] = [];
    
    for (let page = 1; page <= maxPages; page++) {
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

        console.log(`🟠 Triggering page ${page}/${maxPages} for run ${runData.id}`);
        
        try {
          // Fire and forget - trigger the scout-yad2 function
          await fetch(`${supabaseUrl}/functions/v1/scout-yad2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              config_id: configId,
              page: page,
              run_id: runData.id,
              max_pages: maxPages
            })
          });
        } catch (error) {
          console.error(`Error triggering page ${page}:`, error);
        }
      };

      triggerPromises.push(triggerPage());
    }

    // Start all page triggers (they will execute with their own delays)
    // Don't await all - let them run in background
    Promise.all(triggerPromises).catch(err => {
      console.error('Error in page triggers:', err);
    });

    return new Response(JSON.stringify({
      success: true,
      run_id: runData.id,
      pages_triggered: maxPages,
      message: `Started scraping ${maxPages} pages for ${config.name}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('trigger-yad2-pages error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
