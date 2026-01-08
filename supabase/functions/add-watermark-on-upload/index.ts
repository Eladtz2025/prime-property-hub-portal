import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

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

    console.log('🎨 Starting watermark process with ImageScript...');
    console.log('📍 Position:', position, 'Opacity:', opacity);

    // Decode base64 image
    const base64Data = imageData.split(',')[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    console.log('✅ Image buffer created');

    // Load the main image
    const image = await Image.decode(imageBuffer);
    const imageWidth = image.width;
    const imageHeight = image.height;

    console.log('✅ Image loaded:', imageWidth, 'x', imageHeight);

    // Load logo from URL
    const logoResponse = await fetch(logoUrl);
    if (!logoResponse.ok) {
      throw new Error(`Failed to fetch logo: ${logoResponse.statusText}`);
    }
    const logoBuffer = new Uint8Array(await logoResponse.arrayBuffer());
    const logo = await Image.decode(logoBuffer);

    console.log('✅ Logo loaded from URL');

    // Calculate logo size (15% of image width)
    const logoWidth = Math.floor(imageWidth * 0.15);
    const aspectRatio = logo.height / logo.width;
    const logoHeight = Math.floor(logoWidth * aspectRatio);

    // Resize logo
    logo.resize(logoWidth, logoHeight);

    console.log('✅ Logo resized to:', logoWidth, 'x', logoHeight);

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
    image.composite(logo, x, y);

    console.log('✅ Watermark applied');

    // Convert to JPEG
    const outputBuffer = await image.encodeJPEG(90);
    const base64Output = btoa(String.fromCharCode(...outputBuffer));
    const watermarkedImage = `data:image/jpeg;base64,${base64Output}`;

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
