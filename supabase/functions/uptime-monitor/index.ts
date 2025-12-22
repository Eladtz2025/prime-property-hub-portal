import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

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

    const startTime = Date.now();
    
    // Simple health check query
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;
    
    let status: 'up' | 'down' | 'slow' = 'up';
    let errorMessage: string | null = null;
    let alertSent = false;

    if (error) {
      status = 'down';
      errorMessage = error.message;
    } else if (responseTime > 3000) {
      status = 'slow';
      errorMessage = `Response time exceeded threshold: ${responseTime}ms`;
    }

    // Log the monitoring result
    const { error: logError } = await supabase
      .from('monitoring_logs')
      .insert({
        status,
        response_time_ms: responseTime,
        error_message: errorMessage,
        alert_sent: alertSent,
      });

    if (logError) {
      console.error('Failed to log monitoring result:', logError);
    }

    // Send alert if status is not 'up'
    if (status !== 'up') {
      try {
        const alertResponse = await fetch(`${supabaseUrl}/functions/v1/send-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            severity: status === 'down' ? 'critical' : 'warning',
            title: status === 'down' ? 'האתר לא זמין!' : 'האתר מגיב לאט',
            message: errorMessage || `זמן תגובה: ${responseTime}ms`,
            type: 'monitoring',
          }),
        });

        if (alertResponse.ok) {
          alertSent = true;
          // Update the log with alert_sent = true
          await supabase
            .from('monitoring_logs')
            .update({ alert_sent: true })
            .eq('status', status)
            .order('created_at', { ascending: false })
            .limit(1);
        }
      } catch (alertError) {
        console.error('Failed to send alert:', alertError);
      }
    }

    console.log(`Health check completed: status=${status}, response_time=${responseTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        status,
        response_time_ms: responseTime,
        error_message: errorMessage,
        alert_sent: alertSent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Uptime monitor error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
