import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const phoneSchema = z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format');
const messageSchema = z.string().min(1).max(4096).trim();

const singleMessageSchema = z.object({
  phone: phoneSchema,
  message: messageSchema,
  propertyId: z.string().uuid().optional(),
  type: z.literal('single').optional()
});

const bulkMessageSchema = z.object({
  type: z.literal('bulk'),
  bulkData: z.array(z.object({
    phone: phoneSchema,
    message: messageSchema,
    propertyId: z.string().uuid().optional()
  })).max(50) // Limit bulk sends to 50
});

const requestSchema = z.discriminatedUnion('type', [
  singleMessageSchema,
  bulkMessageSchema
]);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Green API credentials
    const apiToken = Deno.env.get('GREEN_API_TOKEN');
    const instanceId = Deno.env.get('GREEN_API_INSTANCE_ID');

    if (!apiToken || !instanceId) {
      throw new Error('Green API credentials not configured');
    }

    // Parse and validate request
    const rawBody = await req.json();
    const requestData = requestSchema.parse(rawBody);

    // Handle bulk or single send
    if (requestData.type === 'bulk' && 'bulkData' in requestData) {
      const results = await Promise.all(
        requestData.bulkData.map(item =>
          sendSingleMessage(item.phone, item.message, apiToken, instanceId, item.propertyId, user.id)
        )
      );
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          results,
          sent: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const result = await sendSingleMessage(
        requestData.phone, 
        requestData.message, 
        apiToken, 
        instanceId, 
        requestData.propertyId,
        user.id
      );
      
      return new Response(
        JSON.stringify({ success: result.success, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in whatsapp-send function:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation error', 
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
  propertyId?: string,
  userId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Initialize Supabase with service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Clean and format phone number
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('972') ? cleanPhone : `972${cleanPhone}`;
    const chatId = `${formattedPhone}@c.us`;

    console.log('Sending WhatsApp message');

    // Send message via Green API
    const greenApiUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
    
    const response = await fetch(greenApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: chatId,
        message: message
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message via Green API');
    }

    const messageId = result.idMessage;
    console.log('Message sent successfully');

    // Save to database
    const { data: dbRecord, error: dbError } = await supabase
      .from('whatsapp_messages')
      .insert({
        phone: formattedPhone,
        message: message,
        whatsapp_message_id: messageId,
        status: 'sent',
        direction: 'outbound',
        property_id: propertyId,
        api_source: 'green_api',
        green_api_instance_id: instanceId
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving to database:', dbError);
    }

    // Update or create contact
    await supabase
      .from('whatsapp_contacts')
      .upsert({
        phone: formattedPhone,
        is_whatsapp_user: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'phone'
      });

    return { 
      success: true, 
      messageId 
    };

  } catch (error) {
    console.error('Error sending message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}