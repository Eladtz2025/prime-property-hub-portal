import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, message, template_id } = await req.json();
    console.log(`Bulk send initiated for ${recipients.length} recipients`);

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients array is required');
    }

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required');
    }

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Create bulk send record
    const { data: bulkSend, error: bulkError } = await supabase
      .from('bulk_sends')
      .insert({
        sent_by: user.id,
        message,
        template_id: template_id || null,
        recipient_count: recipients.length,
        recipient_phones: recipients.map((r: any) => r.phone),
        successful_sends: 0,
        failed_sends: 0,
      })
      .select()
      .single();

    if (bulkError) {
      console.error('Error creating bulk send record:', bulkError);
      throw bulkError;
    }

    console.log('Bulk send record created:', bulkSend.id);

    // Send messages with delay between each
    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const recipient of recipients) {
      try {
        // Replace variables in message
        let personalizedMessage = message
          .replace(/{שם}/g, recipient.name || '')
          .replace(/{כתובת}/g, recipient.propertyAddress || '');

        // Call the existing whatsapp-send function
        const { data: sendResult, error: sendError } = await supabase.functions.invoke(
          'whatsapp-send',
          {
            body: {
              phone: recipient.phone,
              message: personalizedMessage,
            },
          }
        );

        if (sendError) {
          console.error(`Failed to send to ${recipient.phone}:`, sendError);
          failCount++;
          results.push({
            phone: recipient.phone,
            name: recipient.name,
            success: false,
            error: sendError.message,
          });
        } else {
          console.log(`Successfully sent to ${recipient.phone}`);
          successCount++;
          results.push({
            phone: recipient.phone,
            name: recipient.name,
            success: true,
          });
        }

        // Small delay between messages (1.5 seconds)
        if (recipients.indexOf(recipient) < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (err) {
        console.error(`Error sending to ${recipient.phone}:`, err);
        failCount++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Update bulk send record with results
    await supabase
      .from('bulk_sends')
      .update({
        successful_sends: successCount,
        failed_sends: failCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', bulkSend.id);

    console.log(`Bulk send completed: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        bulk_send_id: bulkSend.id,
        total: recipients.length,
        successful: successCount,
        failed: failCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in whatsapp-bulk-send:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
