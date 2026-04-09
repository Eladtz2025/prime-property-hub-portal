import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tali's phone number for notifications
const NOTIFICATION_PHONE = '972545503055';

interface LeadNotification {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const greenApiToken = Deno.env.get('GREEN_API_TOKEN');
    const greenApiInstanceId = Deno.env.get('GREEN_API_INSTANCE_ID');

    if (!greenApiToken || !greenApiInstanceId) {
      console.error('Missing Green API credentials');
      return new Response(
        JSON.stringify({ error: 'Green API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const leadData: LeadNotification = await req.json();
    console.log('New lead notification request:', leadData);

    // Format the WhatsApp message
    const message = `🔔 *פנייה חדשה מהאתר!*

👤 *שם:* ${leadData.name}
📧 *אימייל:* ${leadData.email}
📱 *טלפון:* ${leadData.phone || 'לא צוין'}

💬 *הודעה:*
${leadData.message}

📍 *מקור:* ${leadData.source || 'אתר האינטרנט'}`;

    // Send message via Green API
    const greenApiUrl = `https://api.green-api.com/waInstance${greenApiInstanceId}/sendMessage/${greenApiToken}`;
    
    const response = await fetch(greenApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: `${NOTIFICATION_PHONE}@c.us`,
        message: message
      }),
    });

    const responseData = await response.json();
    console.log('Green API response:', responseData);

    if (!response.ok) {
      console.error('Green API error:', responseData);
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp notification', details: responseData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WhatsApp notification sent successfully to Tali');

    return new Response(
      JSON.stringify({ success: true, messageId: responseData.idMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-new-lead function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
