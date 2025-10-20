import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import sharp from "npm:sharp@0.33.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, logoUrl, position = 'bottom-right', opacity = 0.9 } = await req.json();

    console.log('🎨 Starting watermark process with Sharp...');
    console.log('📍 Position:', position, 'Opacity:', opacity);

    // Decode base64 image
    const base64Data = imageData.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    console.log('✅ Image buffer created');

    // Load logo from URL
    const logoResponse = await fetch(logoUrl);
    if (!logoResponse.ok) {
      throw new Error(`Failed to fetch logo: ${logoResponse.statusText}`);
    }
    const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

    console.log('✅ Logo loaded from URL');

    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const imageWidth = metadata.width!;
    const imageHeight = metadata.height!;

    // Calculate logo size (15% of image width)
    const logoWidth = Math.floor(imageWidth * 0.15);

    // Resize logo and apply opacity
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoWidth)
      .png() // Convert to PNG for alpha channel support
      .ensureAlpha()
      .toBuffer();

    // Get resized logo dimensions
    const logoMeta = await sharp(resizedLogo).metadata();
    const logoHeight = logoMeta.height!;

    // Calculate position
    const margin = 20;
    let x = 0, y = 0;

    switch (position) {
      case 'bottom-right':
        x = imageWidth - logoWidth - margin;
        y = imageHeight - logoHeight - margin;
        break;
      case 'bottom-left':
        x = margin;
        y = imageHeight - logoHeight - margin;
        break;
      case 'top-right':
        x = imageWidth - logoWidth - margin;
        y = margin;
        break;
      case 'top-left':
        x = margin;
        y = margin;
        break;
    }

    console.log('✅ Logo positioned at:', { x, y });

    // Apply watermark using composite
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([{
        input: resizedLogo,
        top: y,
        left: x,
        blend: 'over'
      }])
      .jpeg({ quality: 90 })
      .toBuffer();

    // Convert to base64
    const watermarkedImage = `data:image/jpeg;base64,${watermarkedBuffer.toString('base64')}`;

    console.log('✅ Watermark applied successfully');

    return new Response(
      JSON.stringify({ 
        watermarkedImage,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in watermark function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
