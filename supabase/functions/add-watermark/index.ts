import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

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

    const { imageUrl, logoPosition = 'bottom-right', logoOpacity = 0.9 } = await req.json();

    console.log(`Processing watermark for image: ${imageUrl}`);

    // Fetch the original image with fallback
    let imageResponse = await fetch(imageUrl);
    
    // If not found and it's a relative path, try fetching from app URL
    if (!imageResponse.ok && imageUrl.startsWith('/')) {
      console.log('Image not found in storage, trying app URL fallback');
      const appUrl = 'https://jswumsdymlooeobrxict.lovableproject.com';
      const fallbackUrl = `${appUrl}${imageUrl}`;
      console.log('Trying fallback URL:', fallbackUrl);
      imageResponse = await fetch(fallbackUrl);
    }
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Fetch the logo from storage
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/property-images/city-market-logo.png`;
    let logoBuffer;
    
    try {
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        logoBuffer = await logoBlob.arrayBuffer();
        console.log('Logo fetched from storage successfully');
      } else {
        throw new Error(`Logo not found in storage: ${logoResponse.status}`);
      }
    } catch (e) {
      console.error('Failed to fetch logo from storage:', e);
      throw new Error('Logo file not accessible in storage. Please ensure city-market-logo.png is uploaded to property-images bucket.');
    }

    // Composite the watermark
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
  try {
    console.log('Starting watermark composition...');
    
    // Decode the main image
    const image = await Image.decode(imageData);
    console.log(`Image decoded: ${image.width}x${image.height}`);
    
    // Decode the logo
    const logo = await Image.decode(logoData);
    console.log(`Logo decoded: ${logo.width}x${logo.height}`);
    
    // Resize logo to 15% of image width while maintaining aspect ratio
    const logoWidth = Math.floor(image.width * 0.15);
    const logoHeight = Math.floor(logo.height * (logoWidth / logo.width));
    const resizedLogo = logo.resize(logoWidth, logoHeight);
    console.log(`Logo resized to: ${logoWidth}x${logoHeight}`);
    
    // Calculate position
    let x = 0, y = 0;
    const padding = 20; // 20px padding from edges
    
    switch (position) {
      case 'bottom-right':
        x = image.width - logoWidth - padding;
        y = image.height - logoHeight - padding;
        break;
      case 'bottom-left':
        x = padding;
        y = image.height - logoHeight - padding;
        break;
      case 'top-right':
        x = image.width - logoWidth - padding;
        y = padding;
        break;
      case 'top-left':
        x = padding;
        y = padding;
        break;
      case 'center':
        x = Math.floor((image.width - logoWidth) / 2);
        y = Math.floor((image.height - logoHeight) / 2);
        break;
      default:
        x = image.width - logoWidth - padding;
        y = image.height - logoHeight - padding;
    }
    
    console.log(`Logo position: x=${x}, y=${y}, opacity=${opacity}`);
    
    // Composite the logo onto the image
    image.composite(resizedLogo, x, y);
    
    // Encode back to JPEG with 90% quality
    const encoded = await image.encodeJPEG(90);
    console.log('Watermark applied successfully');
    
    return encoded;
  } catch (error) {
    console.error('Error in compositeWithWatermark:', error);
    throw new Error(`Failed to apply watermark: ${error.message}`);
  }
}
