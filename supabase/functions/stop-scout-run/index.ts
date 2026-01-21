import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function to stop a running scout run
 * Updates the run status to 'stopped' and sets completed_at
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { run_id, config_id } = await req.json();

    if (!run_id && !config_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either run_id or config_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let query = supabase
      .from('scout_runs')
      .update({
        status: 'stopped',
        error_message: 'הופסק ידנית',
        completed_at: new Date().toISOString()
      })
      .eq('status', 'running');

    if (run_id) {
      query = query.eq('id', run_id);
    } else if (config_id) {
      query = query.eq('config_id', config_id);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('Error stopping run:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stoppedCount = data?.length || 0;
    console.log(`Stopped ${stoppedCount} running scout run(s)`);

    return new Response(JSON.stringify({
      success: true,
      stopped_count: stoppedCount,
      stopped_runs: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('stop-scout-run error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
