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
    const WEBHOOK_VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

    // Handle webhook verification (GET request)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Webhook verification request:', { mode, token, challenge });

      if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('Webhook verified successfully');
        return new Response(challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      } else {
        console.log('Webhook verification failed');
        return new Response('Forbidden', {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Received WhatsApp webhook:', JSON.stringify(body, null, 2));

      // Determine API source and process accordingly
      if (body.typeWebhook) {
        // Green-API format
        console.log('Processing Green-API webhook');
        await processGreenAPIWebhook(body);
      } else if (body.entry && body.entry[0] && body.entry[0].changes) {
        // Meta WhatsApp Business API format
        console.log('Processing Meta API webhook');
        await processMetaAPIWebhook(body);
      } else {
        console.log('Unknown webhook format:', body);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    async function processGreenAPIWebhook(body: any) {
      try {
        if (body.typeWebhook === 'incomingMessageReceived') {
          const { senderData, messageData, timestamp, idMessage } = body;
          
          // Determine chat type (individual vs group)
          const chatType = senderData.chatId.includes('@g.us') ? 'group' : 'individual';
          
          // Extract message content based on type
          let messageText = '';
          if (messageData.typeMessage === 'textMessage') {
            messageText = messageData.textMessageData?.textMessage || '';
          } else if (messageData.typeMessage === 'reactionMessage') {
            messageText = `Reaction: ${messageData.extendedTextMessageData?.text || ''}`;
          } else {
            messageText = `[${messageData.typeMessage}]`;
          }

          // Store message in database
          const { error: dbError } = await supabase
            .from('whatsapp_messages')
            .insert({
              phone: senderData.sender?.replace('@c.us', '') || '',
              message: messageText,
              whatsapp_message_id: idMessage,
              status: 'received',
              direction: 'inbound',
              message_type: messageData.typeMessage,
              timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
              chat_type: chatType,
              group_name: chatType === 'group' ? senderData.chatName : null,
              sender_name: senderData.senderName || senderData.senderContactName,
              api_source: 'green-api',
              chat_id: senderData.chatId,
              sender_id: senderData.sender
            });

          if (dbError) {
            console.error('Error storing Green-API message:', dbError);
          } else {
            console.log('Successfully stored Green-API message');
          }
        } else if (body.typeWebhook === 'quotaExceeded') {
          console.log('Green-API quota exceeded:', body.quotaData);
        }
      } catch (error) {
        console.error('Error processing Green-API webhook:', error);
      }
    }

    async function processMetaAPIWebhook(body: any) {
      try {
        for (const change of body.entry[0].changes) {
          if (change.value && change.value.messages) {
            for (const message of change.value.messages) {
              console.log('Processing Meta API incoming message:', message);

              // Store incoming message in database
              const { error: dbError } = await supabase
                .from('whatsapp_messages')
                .insert({
                  phone: message.from,
                  message: message.text?.body || message.type,
                  whatsapp_message_id: message.id,
                  status: 'received',
                  direction: 'inbound',
                  message_type: message.type,
                  timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                  chat_type: 'individual',
                  api_source: 'meta',
                  chat_id: message.from,
                  sender_id: message.from
                });

              if (dbError) {
                console.error('Error storing Meta API message:', dbError);
              } else {
                console.log('Successfully stored Meta API message');
              }
            }
          }

          // Handle message status updates (delivered, read, etc.)
          if (change.value && change.value.statuses) {
            for (const status of change.value.statuses) {
              console.log('Processing message status:', status);

              try {
                // Update message status in database
                const { error: dbError } = await supabase
                  .from('whatsapp_messages')
                  .update({ 
                    status: status.status,
                    updated_at: new Date().toISOString()
                  })
                  .eq('whatsapp_message_id', status.id);

                if (dbError) {
                  console.error('Error updating message status:', dbError);
                }
              } catch (error) {
                console.error('Error processing status update:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing Meta API webhook:', error);
      }
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Error in whatsapp-webhook function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});