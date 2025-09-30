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
    const webhookData = await req.json();
    console.log('Received webhook:', JSON.stringify(webhookData, null, 2));

    // Handle different types of webhooks from Green API
    const { typeWebhook, body } = webhookData;

    switch (typeWebhook) {
      case 'incomingMessageReceived':
        await handleIncomingMessage(body);
        break;
      
      case 'outgoingMessageStatus':
        await handleMessageStatus(body);
        break;
      
      case 'incomingCall':
        console.log('Incoming call received:', body);
        break;
      
      default:
        console.log('Unknown webhook type:', typeWebhook);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in whatsapp-webhook function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleIncomingMessage(messageBody: any) {
  const { 
    idMessage,
    timestamp,
    senderData,
    messageData
  } = messageBody;

  const phone = senderData.chatId.replace('@c.us', '');
  const senderName = senderData.senderName || senderData.sender;
  
  console.log(`Incoming message from ${phone}: ${messageData.textMessageData?.textMessage || 'Non-text message'}`);

  // Save incoming message to database
  const { error: dbError } = await supabase
    .from('whatsapp_messages')
    .insert({
      phone: phone,
      message: messageData.textMessageData?.textMessage || '[Media/Other]',
      whatsapp_message_id: idMessage,
      status: 'received',
      direction: 'inbound',
      api_source: 'green_api',
      sender_name: senderName,
      message_type: messageData.typeMessage || 'textMessage',
      timestamp: new Date(timestamp * 1000).toISOString()
    });

  if (dbError) {
    console.error('Error saving incoming message:', dbError);
  }

  // Update contact information
  await supabase
    .from('whatsapp_contacts')
    .upsert({
      phone: phone,
      name: senderName,
      is_whatsapp_user: true,
      last_seen: new Date(timestamp * 1000).toISOString()
    }, {
      onConflict: 'phone'
    });
}

async function handleMessageStatus(statusBody: any) {
  const {
    idMessage,
    status,
    timestamp
  } = statusBody;

  console.log(`Message status update: ${idMessage} -> ${status}`);

  // Update message status in database
  const updateData: any = {
    status: status
  };

  if (status === 'delivered') {
    updateData.delivered_at = new Date(timestamp * 1000).toISOString();
  } else if (status === 'read') {
    updateData.read_at = new Date(timestamp * 1000).toISOString();
  }

  const { error: updateError } = await supabase
    .from('whatsapp_messages')
    .update(updateData)
    .eq('whatsapp_message_id', idMessage);

  if (updateError) {
    console.error('Error updating message status:', updateError);
  }
}