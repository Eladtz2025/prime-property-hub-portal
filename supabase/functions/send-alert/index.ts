const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertPayload {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  type: string;
  details?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const alertEmail = Deno.env.get('ALERT_EMAIL');

    if (!resendApiKey || !alertEmail) {
      console.error('Missing RESEND_API_KEY or ALERT_EMAIL');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing email configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: AlertPayload = await req.json();
    const { severity, title, message, type, details } = payload;

    const severityColors = {
      critical: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    };

    const severityLabels = {
      critical: 'קריטי 🔴',
      warning: 'אזהרה 🟡',
      info: 'מידע 🔵',
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background-color: ${severityColors[severity]}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${severityLabels[severity]}</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">${title}</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">${message}</p>
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <p style="margin: 0; color: #888; font-size: 14px;">
                <strong>סוג:</strong> ${type}<br>
                <strong>זמן:</strong> ${new Date().toLocaleString('he-IL')}
              </p>
              ${details ? `<pre style="background-color: #e9ecef; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(details, null, 2)}</pre>` : ''}
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #999; font-size: 12px;">התראה אוטומטית ממערכת הניטור</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'System Monitor <onboarding@resend.dev>',
        to: [alertEmail],
        subject: `[${severityLabels[severity]}] ${title}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('Alert sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, message_id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send alert error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
