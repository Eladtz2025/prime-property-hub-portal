import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Track webhook requests per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // Max 100 webhooks per minute per IP
const RATE_WINDOW = 60000; // 1 minute in milliseconds

// Validation schemas
const greenApiWebhookSchema = z.object({
  typeWebhook: z.string(),
  instanceData: z.object({
    idInstance: z.number(),
    wid: z.string(),
    typeInstance: z.string(),
  }).optional(),
  timestamp: z.number(),
  idMessage: z.string().optional(),
  senderData: z.object({
    chatId: z.string(),
    sender: z.string().optional(),
    senderName: z.string().optional(),
  }).optional(),
  messageData: z.any().optional(),
  body: z.any().optional(),
  status: z.string().optional(),
});

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

async function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    console.log('No signature provided');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!checkRateLimit(ip)) {
      console.log(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get webhook secret
    const webhookSecret = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (!webhookSecret) {
      console.error('WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook verification not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read body as text for signature verification
    const bodyText = await req.text();
    
    // Verify webhook signature
    const signature = req.headers.get('X-Green-Api-Signature');
    const isValidSignature = await verifyWebhookSignature(bodyText, signature, webhookSecret);
    
    if (!isValidSignature) {
      console.log('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate webhook data
    const webhookData = greenApiWebhookSchema.parse(JSON.parse(bodyText));
    console.log('Received valid webhook:', webhookData.typeWebhook);

    // Handle different types of webhooks from Green API
    const { typeWebhook, body } = webhookData;

    switch (typeWebhook) {
      case 'incomingMessageReceived':
        await handleIncomingMessage(webhookData);
        break;
      
      case 'outgoingMessageStatus':
        await handleMessageStatus(webhookData);
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

async function handleIncomingMessage(webhookData: any) {
  const { 
    idMessage,
    timestamp,
    senderData,
    messageData
  } = webhookData;

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

async function handleMessageStatus(webhookData: any) {
  const {
    idMessage,
    status,
    timestamp
  } = webhookData;

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