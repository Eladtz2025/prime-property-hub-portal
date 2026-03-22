import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  phone: string;
  message: string;
  propertyId?: string;
  type?: 'single' | 'bulk';
  bulkData?: Array<{
    phone: string;
    message: string;
    propertyId?: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user credentials from profile
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Fetch user's Green API credentials from profile
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('green_api_instance_id, green_api_token')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.green_api_instance_id || !profile?.green_api_token) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp לא מחובר. יש להגדיר את פרטי Green API בהגדרות הפרופיל.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const greenApiToken = profile.green_api_token;
    const greenApiInstanceId = profile.green_api_instance_id;

    const requestData: SendMessageRequest = await req.json();
    console.log('WhatsApp send request:', { ...requestData, user: userId });

    // For bulk sending
    if (requestData.type === 'bulk' && requestData.bulkData) {
      const results = [];
      
      for (const item of requestData.bulkData) {
        try {
          const result = await sendSingleMessage(
            item.phone,
            item.message,
            greenApiToken,
            greenApiInstanceId,
            serviceClient,
            item.propertyId
          );
          results.push({ phone: item.phone, success: true, result });
        } catch (error) {
          console.error(`Failed to send to ${item.phone}:`, error);
          results.push({ 
            phone: item.phone, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          results,
          totalSent: results.filter(r => r.success).length,
          totalFailed: results.filter(r => !r.success).length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For single message sending
    const result = await sendSingleMessage(
      requestData.phone,
      requestData.message,
      greenApiToken,
      greenApiInstanceId,
      serviceClient,
      requestData.propertyId
    );

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in whatsapp-send function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendSingleMessage(
  phone: string,
  message: string,
  apiToken: string,
  instanceId: string,
  supabase: any,
  propertyId?: string
) {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('972') ? cleanPhone : `972${cleanPhone.replace(/^0/, '')}`;
  
  console.log(`Sending WhatsApp to ${formattedPhone}`);

  const greenApiUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
  
  const response = await fetch(greenApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId: `${formattedPhone}@c.us`,
      message: message
    }),
  });

  const responseData = await response.json();
  console.log('Green API response:', responseData);

  if (!response.ok) {
    throw new Error(`Green API error: ${responseData.error || 'Unknown error'}`);
  }

  // Save message to database
  const { data: messageData, error: dbError } = await supabase
    .from('whatsapp_messages')
    .insert({
      phone: formattedPhone,
      message: message,
      property_id: propertyId,
      whatsapp_message_id: responseData.idMessage,
      green_api_instance_id: instanceId,
      status: 'sent',
      direction: 'outbound',
      api_source: 'green_api'
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database error:', dbError);
    throw new Error(`Database error: ${dbError.message}`);
  }

  // Update/create contact
  await supabase
    .from('whatsapp_contacts')
    .upsert({
      phone: formattedPhone,
      is_whatsapp_user: true,
      last_seen: new Date().toISOString()
    }, {
      onConflict: 'phone'
    });

  return { messageId: responseData.idMessage, dbRecord: messageData };
}
