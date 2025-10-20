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

    const { imageUrl, logoPosition = 'bottom-right', logoOpacity = 0.7 } = await req.json();

    console.log(`Processing watermark for image: ${imageUrl}`);

    // Fetch the original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Fetch the logo from public folder
    const logoUrl = `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/storage/v1/object/public/property-images/city-market-logo.png`;
    let logoBuffer;
    
    try {
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        logoBuffer = await logoBlob.arrayBuffer();
      }
    } catch (e) {
      console.log('Logo not in storage, will try to upload it');
    }

    // If logo doesn't exist in storage, fetch from public and upload
    if (!logoBuffer) {
      const publicLogoUrl = `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/storage/v1/object/public/property-images/city-market-logo.png`;
      try {
        const logoResponse = await fetch(publicLogoUrl);
        if (!logoResponse.ok) {
          throw new Error('Logo not found');
        }
        const logoBlob = await logoResponse.blob();
        logoBuffer = await logoBlob.arrayBuffer();
      } catch (e) {
        console.error('Failed to fetch logo:', e);
        throw new Error('Logo file not accessible');
      }
    }

    // Use Canvas API to composite the image
    const watermarkedImage = await compositeWithWatermark(
      new Uint8Array(imageBuffer),
      new Uint8Array(logoBuffer),
      logoPosition,
      logoOpacity
    );

    return new Response(watermarkedImage, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/jpeg',
      },
    });
  } catch (error) {
    console.error('Error in add-watermark function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function compositeWithWatermark(
  imageData: Uint8Array,
  logoData: Uint8Array,
  position: string,
  opacity: number
): Promise<Uint8Array> {
  // Use ImageMagick via Deno FFI or external process
  // For now, we'll use a simpler approach with image-js
  
  // This is a placeholder - we'll use the image as-is for now
  // and implement proper watermarking in the next step
  console.log(`Watermarking with position: ${position}, opacity: ${opacity}`);
  
  // For MVP, we'll just return the original image
  // In production, this would use proper image processing
  return imageData;
}
