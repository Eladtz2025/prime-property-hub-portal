import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { fetchScoutSettings } from '../_shared/settings.ts';
import { createInitialPageStats } from '../_shared/run-helpers.ts';

/**
 * Unified Trigger for all Jina-based Scout sources
 * Clone of trigger-scout-pages with targets pointing to *-jina functions.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOURCE_DELAYS: Record<string, number> = {
  yad2: 3000,
  madlan: 30000,
  homeless: 2000,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { config_id } = await req.json();
    if (!config_id) {
      return new Response(JSON.stringify({ success: false, error: 'config_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: config, error: configError } = await supabase
      .from('scout_configs')
      .select('id, name, source, max_pages, page_delay_seconds, start_page')
      .eq('id', config_id)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ success: false, error: 'Config not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const source = config.source as string;
    console.log(`🚀 Trigger Scout Pages Jina - Config: ${config.name} (${source})`);

    const settings = await fetchScoutSettings(supabase);
    let pagesToScan: number;
    switch (source) {
      case 'yad2': pagesToScan = config.max_pages ?? settings.scraping.yad2_pages ?? 4; break;
      case 'madlan': pagesToScan = config.max_pages ?? settings.scraping.madlan_pages ?? 15; break;
      case 'homeless': pagesToScan = config.max_pages ?? settings.scraping.homeless_pages ?? 5; break;
      default: pagesToScan = 5;
    }

    // Check for existing running job
    const { data: existingRun } = await supabase
      .from('scout_runs')
      .select('id, started_at')
      .eq('config_id', config_id)
      .eq('status', 'running')
      .eq('scanner', 'jina')
      .single();

    if (existingRun) {
      const runAgeMs = Date.now() - new Date(existingRun.started_at).getTime();
      const STALE_RUN_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

      if (runAgeMs > STALE_RUN_THRESHOLD_MS) {
        console.warn(`⚠️ Stale run ${existingRun.id} detected (${Math.round(runAgeMs / 60000)} min old) — auto-closing as partial`);
        await supabase
          .from('scout_runs')
          .update({ status: 'partial', completed_at: new Date().toISOString() })
          .eq('id', existingRun.id);
        // Continue to create a new run...
      } else {
        return new Response(JSON.stringify({ 
          error: 'Config already has a running job',
          run_id: existingRun.id 
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const startPage = config.start_page || 1;
    const initialPageStats = createInitialPageStats(pagesToScan, startPage);

    const { data: runData, error: runError } = await supabase
      .from('scout_runs')
      .insert({ config_id, source, status: 'running', properties_found: 0, new_properties: 0, page_stats: initialPageStats, scanner: 'jina' })
      .select().single();

    if (runError) {
      return new Response(JSON.stringify({ error: 'Failed to create run' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const runId = runData.id;
    // Madlan: route to scout-madlan-direct.
    // The CF Worker path is currently getting upstream=403 in production,
    // while the direct iPhone-Safari strategy is the safer live fallback.
    const targetFunction = source === 'madlan'
      ? 'scout-madlan-direct'
      : `scout-${source}-jina`;
    const delayMs = config.page_delay_seconds ? config.page_delay_seconds * 1000 : SOURCE_DELAYS[source] || 5000;
    const totalPages = pagesToScan - startPage + 1;

    console.log(`📄 Created run ${runId} for ${source} (Jina): pages ${startPage}-${pagesToScan} (${totalPages} pages, delay: ${delayMs}ms)`);

    // Sequential mode for madlan and yad2
    if (source === 'madlan' || source === 'yad2') {
      console.log(`📄 ${source} sequential mode: triggering only page ${startPage}`);
      try {
        await fetch(`${supabaseUrl}/functions/v1/${targetFunction}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
          body: JSON.stringify({ config_id, page: startPage, run_id: runId, max_pages: pagesToScan, start_page: startPage })
        });
      } catch (error) {
        console.error(`Error triggering ${source}-jina page ${startPage}:`, error);
      }
    } else {
      // Parallel mode for homeless
      const triggerPromises: Promise<void>[] = [];
      for (let page = startPage; page <= pagesToScan; page++) {
        const pageDelay = (page - startPage) * delayMs;
        const triggerPage = async () => {
          await new Promise(resolve => setTimeout(resolve, pageDelay));
          const { data: runCheck } = await supabase.from('scout_runs').select('status').eq('id', runId).single();
          if (runCheck?.status === 'stopped') { console.log(`🛑 Run ${runId} stopped, skipping page ${page}`); return; }
          console.log(`📄 Triggering ${source}-jina page ${page}/${pagesToScan}`);
          try {
            await fetch(`${supabaseUrl}/functions/v1/${targetFunction}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
              body: JSON.stringify({ config_id, page, run_id: runId, max_pages: pagesToScan })
            });
          } catch (error) { console.error(`Error triggering ${source}-jina page ${page}:`, error); }
        };
        triggerPromises.push(triggerPage());
      }
      Promise.all(triggerPromises).catch(err => console.error('Error in page triggers:', err));
    }

    return new Response(JSON.stringify({
      success: true, run_id: runId, source, pages_triggered: totalPages, start_page: startPage, delay_ms: delayMs,
      mode: (source === 'madlan' || source === 'yad2') ? 'sequential' : 'parallel',
      message: `Started scraping pages ${startPage}-${pagesToScan} for ${config.name}`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ Trigger Scout Pages Jina failed:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
