import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Stop all currently running availability runs
    const { data: stoppedRunning, error: e1 } = await supabase
      .from('availability_check_runs')
      .update({ status: 'stopped', completed_at: new Date().toISOString() })
      .eq('status', 'running')
      .select('id');

    if (e1) throw e1;

    // Also stop recently completed runs to prevent self-chaining
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: stoppedChained, error: e2 } = await supabase
      .from('availability_check_runs')
      .update({ status: 'stopped' })
      .eq('status', 'completed')
      .gte('completed_at', fiveMinAgo)
      .select('id');

    if (e2) throw e2;

    const totalStopped = (stoppedRunning?.length || 0) + (stoppedChained?.length || 0);
    console.log(`🛑 Stopped ${stoppedRunning?.length || 0} running + ${stoppedChained?.length || 0} recently completed runs`);

    return new Response(JSON.stringify({
      success: true,
      stopped_running: stoppedRunning?.length || 0,
      stopped_chained: stoppedChained?.length || 0,
      total_stopped: totalStopped,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('stop-availability-run error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
