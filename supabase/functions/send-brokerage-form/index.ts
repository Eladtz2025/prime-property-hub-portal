import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendBrokerageFormRequest {
  email: string;
  formData: {
    clientName: string;
    formDate: string;
    brokerName?: string;
  };
  pdfBase64: string;
  language: 'he' | 'en';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, formData, pdfBase64, language }: SendBrokerageFormRequest = await req.json();

    console.log(`Sending brokerage form email to: ${email}`);

    // Validate email
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate PDF data
    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'PDF data is required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isHebrew = language === 'he';
    const subject = isHebrew 
      ? 'טופס הזמנת שירותי תיווך - עותק' 
      : 'Brokerage Services Agreement - Copy';
    
    const htmlContent = isHebrew ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">תודה!</h1>
        <p>שלום ${formData.clientName},</p>
        <p>מצורף עותק של טופס הזמנת שירותי התיווך שחתמת.</p>
        <p>תאריך הטופס: ${formData.formDate}</p>
        ${formData.brokerName ? `<p>מתווך: ${formData.brokerName}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 14px;">
          בברכה,<br/>
          צוות סיטי מרקט
        </p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Thank You!</h1>
        <p>Hello ${formData.clientName},</p>
        <p>Attached is a copy of the brokerage services agreement you signed.</p>
        <p>Form Date: ${formData.formDate}</p>
        ${formData.brokerName ? `<p>Broker: ${formData.brokerName}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 14px;">
          Best regards,<br/>
          City Market Team
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "City Market <onboarding@resend.dev>",
      to: [email],
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: `brokerage-form-${formData.clientName.replace(/\s+/g, '-')}-${formData.formDate}.pdf`,
          content: pdfBase64,
        }
      ]
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-brokerage-form function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
