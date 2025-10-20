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

    console.log('Starting batch watermark process...');

    // Get all property images
    const { data: images, error: fetchError } = await supabase
      .from('property_images')
      .select('id, image_url, property_id');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${images?.length || 0} images to process`);

    const results = {
      total: images?.length || 0,
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // First, upload the logo to storage if it doesn't exist
    try {
      const logoPath = 'city-market-logo.png';
      
      // Check if logo exists
      const { data: logoExists } = await supabase
        .storage
        .from('property-images')
        .list('', { search: logoPath });

      if (!logoExists || logoExists.length === 0) {
        console.log('Uploading logo to storage...');
        
        // Fetch logo from public folder
        const publicLogoUrl = `https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/${logoPath}`;
        
        // For now, we'll skip logo upload and handle it separately
        console.log('Logo will need to be uploaded manually to property-images bucket');
      }
    } catch (logoError) {
      console.error('Error handling logo:', logoError);
    }

    // Process each image
    for (const image of images || []) {
      try {
        console.log(`Processing image ${image.id}: ${image.image_url}`);

        // Build full image URL
        let fullImageUrl = image.image_url;
        if (!fullImageUrl.startsWith('http')) {
          // If it's a relative path, make it absolute
          fullImageUrl = `https://jswumsdymlooeobrxict.supabase.co${fullImageUrl}`;
        }

        // Fetch the original image
        const imageResponse = await fetch(fullImageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        // Generate new filename
        const originalFilename = image.image_url.split('/').pop() || 'image.jpg';
        const watermarkedFilename = `watermarked-${originalFilename}`;

        // Upload the watermarked image to property-images bucket
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('property-images')
          .upload(watermarkedFilename, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('property-images')
          .getPublicUrl(watermarkedFilename);

        // Update the property_images table with new URL
        const { error: updateError } = await supabase
          .from('property_images')
          .update({ image_url: publicUrlData.publicUrl })
          .eq('id', image.id);

        if (updateError) {
          throw updateError;
        }

        results.processed++;
        console.log(`Successfully processed image ${image.id}`);
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to process image ${image.id}: ${error.message}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    console.log('Batch watermark process completed', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in batch-watermark-images function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
