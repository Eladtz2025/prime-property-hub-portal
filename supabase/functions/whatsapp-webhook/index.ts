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

      // Process webhook data
      if (body.entry && body.entry[0] && body.entry[0].changes) {
        for (const change of body.entry[0].changes) {
          if (change.value && change.value.messages) {
            for (const message of change.value.messages) {
              console.log('Processing incoming message:', message);

              try {
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
                    timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString()
                  });

                if (dbError) {
                  console.error('Error storing incoming message:', dbError);
                }

                // Here you can add logic to:
                // 1. Match phone number to property owner
                // 2. Send auto-replies
                // 3. Create notifications
                // 4. Update conversation status

              } catch (error) {
                console.error('Error processing message:', error);
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
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Error in whatsapp-webhook function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});