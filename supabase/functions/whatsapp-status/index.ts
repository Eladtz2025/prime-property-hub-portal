import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHATSAPP_BUSINESS_API_TOKEN = Deno.env.get('WHATSAPP_BUSINESS_API_TOKEN');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    console.log('Checking WhatsApp connection status...');
    
    if (!WHATSAPP_BUSINESS_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.log('Missing WhatsApp credentials');
      return new Response(JSON.stringify({ 
        connected: false, 
        error: 'Missing WhatsApp Business API credentials' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test the WhatsApp Business API connection
    const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_BUSINESS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('WhatsApp connection successful:', data);
      return new Response(JSON.stringify({ 
        connected: true, 
        phoneNumber: data.display_phone_number 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('WhatsApp connection failed:', response.status, response.statusText);
      return new Response(JSON.stringify({ 
        connected: false, 
        error: `API Error: ${response.status}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error checking WhatsApp status:', error);
    return new Response(JSON.stringify({ 
      connected: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});