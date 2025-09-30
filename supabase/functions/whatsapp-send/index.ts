import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

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

    const requestData: SendMessageRequest = await req.json();
    console.log('WhatsApp send request:', requestData);

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
  propertyId?: string
) {
  // Clean and format phone number
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('972') ? cleanPhone : `972${cleanPhone.replace(/^0/, '')}`;
  
  console.log(`Sending WhatsApp to ${formattedPhone}: ${message}`);

  // Send message via Green API
  const greenApiUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
  
  const response = await fetch(greenApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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