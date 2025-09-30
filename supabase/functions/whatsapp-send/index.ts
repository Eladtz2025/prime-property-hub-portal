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

    const GREEN_API_INSTANCE_ID = Deno.env.get('GREEN_API_INSTANCE_ID');
    const GREEN_API_TOKEN = Deno.env.get('GREEN_API_TOKEN');
    
    if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
      console.error('Missing Green-API credentials');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Green-API not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format phone number to chatId format (972XXXXXXXXX@c.us)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '972' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('972')) {
      formattedPhone = '972' + formattedPhone;
    }
    const chatId = `${formattedPhone}@c.us`;

    // Send message via Green-API
    const greenApiUrl = `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`;
    const whatsappResponse = await fetch(greenApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: chatId,
        message: message
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