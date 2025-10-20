import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting logo upload process...');

    // The logo is base64 encoded PNG - City Market Real Estate logo
    const logoBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAMAAADDpiTIAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJcEhZcwAACxMAAAsTAQCanBgAAAC7UExURQAAAAYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHQYOHY3RuD8AAAAfdFJOUwAQ779Aj3/Pz0C/MN+PMO/fIGBQ75BgUH/fQJ9wIHBQG/X6AAAAE3RFWHRUaXRsZQBBZG9iZSBGaXJld29ya3PgNB7KAAAAFnRFWHRBdXRob3IAQWRvYmUgRmlyZXdvcmtzT7MfTgAAAABJRU5ErkJggg==';

    // Convert base64 to buffer
    const logoBuffer = Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));

    console.log('Uploading logo to storage...');

    // Upload to property-images bucket
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('property-images')
      .upload('city-market-logo.png', logoBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Logo uploaded successfully:', uploadData);

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('property-images')
      .getPublicUrl('city-market-logo.png');

    console.log('Public URL:', publicUrlData.publicUrl);

    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrlData.publicUrl,
      path: uploadData.path
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in upload-logo function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
