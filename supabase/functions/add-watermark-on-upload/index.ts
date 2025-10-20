import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts";

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

    console.log('🎨 Starting watermark process...');
    console.log('📍 Position:', position, 'Opacity:', opacity);

    // Load main image from base64
    const base64Data = imageData.split(',')[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const mainImage = await loadImage(imageBuffer);

    console.log('✅ Main image loaded:', mainImage.width, 'x', mainImage.height);

    // Create canvas with same dimensions
    const canvas = createCanvas(mainImage.width, mainImage.height);
    const ctx = canvas.getContext('2d');

    // Draw main image
    ctx.drawImage(mainImage, 0, 0);

    // Load and draw logo watermark
    try {
      // Fetch logo from URL
      const logoResponse = await fetch(logoUrl);
      if (!logoResponse.ok) {
        throw new Error(`Failed to fetch logo: ${logoResponse.statusText}`);
      }
      const logoBuffer = await logoResponse.arrayBuffer();
      const logo = await loadImage(new Uint8Array(logoBuffer));

      console.log('✅ Logo loaded:', logo.width, 'x', logo.height);

      // Calculate logo size (15% of image width)
      const logoWidth = mainImage.width * 0.15;
      const logoHeight = (logo.height / logo.width) * logoWidth;

      // Calculate position
      const margin = 20;
      let x = 0, y = 0;

      switch (position) {
        case 'bottom-right':
          x = mainImage.width - logoWidth - margin;
          y = mainImage.height - logoHeight - margin;
          break;
        case 'bottom-left':
          x = margin;
          y = mainImage.height - logoHeight - margin;
          break;
        case 'top-right':
          x = mainImage.width - logoWidth - margin;
          y = margin;
          break;
        case 'top-left':
          x = margin;
          y = margin;
          break;
      }

      // Draw logo with opacity
      ctx.globalAlpha = opacity;
      ctx.drawImage(logo, x, y, logoWidth, logoHeight);
      ctx.globalAlpha = 1.0;

      console.log('✅ Watermark applied at position:', position);
    } catch (logoError) {
      console.error('⚠️ Logo watermark failed, returning original image:', logoError);
      // Continue without watermark if logo fails
    }

    // Convert to base64
    const watermarkedImage = canvas.toDataURL('image/jpeg', 0.9);

    console.log('✅ Watermark process completed');

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
