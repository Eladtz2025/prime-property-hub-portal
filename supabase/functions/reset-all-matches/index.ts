import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.log('Starting reset-all-matches...');
    
    // Step 1: Clear all matched_leads from all properties
    const { error: clearError } = await supabase
      .from('scouted_properties')
      .update({ matched_leads: [], status: 'new' })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (clearError) throw clearError;
    console.log('✅ Cleared all existing matches');

    // Step 2: Trigger matching via the unified orchestrator
    console.log('🔄 Triggering matching via trigger-matching orchestrator...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/trigger-matching`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ send_whatsapp: false })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to trigger matching: ${errorText}`);
    }

    const triggerResult = await response.json();
    console.log('✅ Matching triggered successfully:', triggerResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'Reset complete, matching triggered via orchestrator',
      properties_cleared: true,
      matching_run_id: triggerResult.run_id,
      properties_to_process: triggerResult.total_properties,
      batches_triggered: triggerResult.batches_triggered
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Reset matches error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
