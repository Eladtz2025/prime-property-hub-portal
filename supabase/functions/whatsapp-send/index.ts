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
    const { phone, message, propertyId } = await req.json();
    
    console.log('Sending WhatsApp message:', { phone, message, propertyId });

    if (!phone || !message) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Phone number and message are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const WHATSAPP_BUSINESS_API_TOKEN = Deno.env.get('WHATSAPP_BUSINESS_API_TOKEN');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!WHATSAPP_BUSINESS_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('Missing WhatsApp Business API credentials');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'WhatsApp Business API not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format phone number (ensure it starts with country code)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '972' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('972')) {
      formattedPhone = '972' + formattedPhone;
    }

    // Send message via WhatsApp Business API
    const whatsappResponse = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_BUSINESS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      }),
    });

    const whatsappData = await whatsappResponse.json();
    
    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: whatsappData.error?.message || 'Failed to send WhatsApp message' 
      }), {
        status: whatsappResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('WhatsApp message sent successfully:', whatsappData);

    // Store message in database for tracking
    try {
      const { error: dbError } = await supabase
        .from('whatsapp_messages')
        .insert({
          phone: formattedPhone,
          message: message,
          property_id: propertyId || null,
          whatsapp_message_id: whatsappData.messages?.[0]?.id,
          status: 'sent',
          direction: 'outbound'
        });

      if (dbError) {
        console.error('Error storing message in database:', dbError);
        // Don't fail the whole request if DB storage fails
      }
    } catch (error) {
      console.error('Database storage error:', error);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: whatsappData.messages?.[0]?.id,
      phone: formattedPhone
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in whatsapp-send function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});