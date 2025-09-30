import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

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
    const greenApiToken = Deno.env.get('GREEN_API_TOKEN');
    const greenApiInstanceId = Deno.env.get('GREEN_API_INSTANCE_ID');

    if (!greenApiToken || !greenApiInstanceId) {
      console.error('Missing Green API credentials');
      return new Response(
        JSON.stringify({ error: 'Green API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action } = await req.json();

    let result;

    switch (action) {
      case 'getSettings':
        result = await getInstanceSettings(greenApiToken, greenApiInstanceId);
        break;
      
      case 'getStateInstance':
        result = await getInstanceState(greenApiToken, greenApiInstanceId);
        break;
      
      case 'getStatusInstance':
        result = await getInstanceStatus(greenApiToken, greenApiInstanceId);
        break;
      
      case 'checkWhatsApp':
        const { phone } = await req.json();
        result = await checkWhatsAppUser(phone, greenApiToken, greenApiInstanceId);
        break;
      
      default:
        throw new Error('Unknown action');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in whatsapp-status function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getInstanceSettings(apiToken: string, instanceId: string) {
  const url = `https://api.green-api.com/waInstance${instanceId}/getSettings/${apiToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to get settings: ${data.error || 'Unknown error'}`);
  }
  
  return data;
}

async function getInstanceState(apiToken: string, instanceId: string) {
  const url = `https://api.green-api.com/waInstance${instanceId}/getStateInstance/${apiToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to get state: ${data.error || 'Unknown error'}`);
  }
  
  return data;
}

async function getInstanceStatus(apiToken: string, instanceId: string) {
  const url = `https://api.green-api.com/waInstance${instanceId}/getStatusInstance/${apiToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to get status: ${data.error || 'Unknown error'}`);
  }
  
  return data;
}

async function checkWhatsAppUser(phone: string, apiToken: string, instanceId: string) {
  // Clean and format phone number
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('972') ? cleanPhone : `972${cleanPhone.replace(/^0/, '')}`;
  
  const url = `https://api.green-api.com/waInstance${instanceId}/checkWhatsapp/${apiToken}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumber: formattedPhone
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to check WhatsApp user: ${data.error || 'Unknown error'}`);
  }
  
  // Update contact in database
  await supabase
    .from('whatsapp_contacts')
    .upsert({
      phone: formattedPhone,
      is_whatsapp_user: data.existsWhatsapp || false
    }, {
      onConflict: 'phone'
    });
  
  return data;
}