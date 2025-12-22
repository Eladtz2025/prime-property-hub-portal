import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorPayload {
  error_message: string;
  error_stack?: string;
  page_url?: string;
  severity: 'critical' | 'warning' | 'info';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ErrorPayload = await req.json();
    const userAgent = req.headers.get('user-agent') || '';

    const { error_message, error_stack, page_url, severity } = payload;

    // Log the error
    const { data, error } = await supabase.from('error_logs').insert({
      error_message,
      error_stack,
      page_url,
      severity,
      user_agent: userAgent,
      alert_sent: false,
    }).select().single();

    if (error) {
      throw new Error(`Failed to log error: ${error.message}`);
    }

    console.log(`Error logged: severity=${severity}, message=${error_message}`);

    // Send alert for critical errors
    let alertSent = false;
    if (severity === 'critical') {
      try {
        const alertResponse = await fetch(`${supabaseUrl}/functions/v1/send-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            severity: 'critical',
            title: 'שגיאה קריטית במערכת',
            message: error_message,
            type: 'error',
            details: { page_url, error_stack },
          }),
        });

        if (alertResponse.ok) {
          alertSent = true;
          await supabase
            .from('error_logs')
            .update({ alert_sent: true })
            .eq('id', data.id);
        }
      } catch (alertError) {
        console.error('Failed to send alert:', alertError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, error_id: data.id, alert_sent: alertSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Log error function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
