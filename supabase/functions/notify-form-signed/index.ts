import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyFormSignedRequest {
  formType: 'brokerage' | 'exclusivity' | 'broker-sharing';
  clientName: string;
  clientPhone?: string;
  agentId: string;
  propertyAddress?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formType, clientName, clientPhone, agentId, propertyAddress }: NotifyFormSignedRequest = await req.json();

    if (!formType || !clientName || !agentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: formType, clientName, agentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get agent's profile to find phone number
    const { data: agentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('phone, email, full_name')
      .eq('id', agentId)
      .single();

    if (profileError || !agentProfile) {
      console.error('Error fetching agent profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formTypeHebrew = {
      'brokerage': 'הסכם תיווך',
      'exclusivity': 'הסכם בלעדיות',
      'broker-sharing': 'טופס שיתוף עמלה'
    }[formType];

    // Create WhatsApp message
    const message = `🎉 התקבלה חתימה חדשה!\n\n📋 סוג טופס: ${formTypeHebrew}\n👤 שם הלקוח: ${clientName}${propertyAddress ? `\n🏠 נכס: ${propertyAddress}` : ''}\n\nהטופס נחתם בהצלחה ונשמר במערכת.`;

    // Try to send WhatsApp notification
    if (agentProfile.phone) {
      try {
        // Normalize phone number
        let phone = agentProfile.phone.replace(/[\s\-\(\)]/g, '');
        if (phone.startsWith('0')) {
          phone = '972' + phone.substring(1);
        }
        if (!phone.startsWith('+')) {
          phone = '+' + phone;
        }
        phone = phone.replace('+', '');

        const greenApiToken = Deno.env.get('GREEN_API_TOKEN');
        const greenApiInstanceId = Deno.env.get('GREEN_API_INSTANCE_ID');

        if (greenApiToken && greenApiInstanceId) {
          const whatsappResponse = await fetch(
            `https://api.green-api.com/waInstance${greenApiInstanceId}/sendMessage/${greenApiToken}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chatId: `${phone}@c.us`,
                message: message
              })
            }
          );

          if (whatsappResponse.ok) {
            console.log('WhatsApp notification sent successfully');
          } else {
            console.error('WhatsApp notification failed:', await whatsappResponse.text());
          }
        }
      } catch (whatsappError) {
        console.error('Error sending WhatsApp:', whatsappError);
      }
    }

    // Create in-app notification
    await supabase.from('notifications').insert({
      recipient_id: agentId,
      type: 'form_signed',
      title: `${formTypeHebrew} נחתם`,
      message: `${clientName} חתם/ה על ${formTypeHebrew}${propertyAddress ? ` לנכס ${propertyAddress}` : ''}`,
      priority: 'high',
    });

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: agentId,
      action: 'form_signed_notification',
      resource_type: formType,
      details: {
        client_name: clientName,
        client_phone: clientPhone,
        property_address: propertyAddress,
        notification_sent: true
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-form-signed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
