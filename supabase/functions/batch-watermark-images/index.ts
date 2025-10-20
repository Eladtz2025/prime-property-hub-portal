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

    // First, ensure logo exists in storage
    await ensureLogoInStorage(supabase, supabaseUrl);

    // Get all property images that need watermarking
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
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each image
    for (const image of images || []) {
      try {
        console.log(`Processing image ${image.id}: ${image.image_url}`);

        // Skip if already watermarked
        if (image.image_url.includes('watermarked-') || image.image_url.includes('/property-images/')) {
          console.log(`Skipping already watermarked image ${image.id}`);
          results.skipped++;
          continue;
        }

        // Build full image URL
        let fullImageUrl = image.image_url;
        if (!fullImageUrl.startsWith('http')) {
          fullImageUrl = `${supabaseUrl}${fullImageUrl}`;
        }

        // Call the add-watermark function
        const watermarkResponse = await fetch(`${supabaseUrl}/functions/v1/add-watermark`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            imageUrl: fullImageUrl,
            logoPosition: 'bottom-right',
            logoOpacity: 0.9,
          }),
        });

        if (!watermarkResponse.ok) {
          const errorText = await watermarkResponse.text();
          throw new Error(`Watermark function failed: ${errorText}`);
        }

        const watermarkedImageBlob = await watermarkResponse.blob();
        const watermarkedImageBuffer = await watermarkedImageBlob.arrayBuffer();

        // Generate new filename
        const originalFilename = image.image_url.split('/').pop() || 'image.jpg';
        const watermarkedFilename = `watermarked-${Date.now()}-${originalFilename}`;

        // Upload the watermarked image to property-images bucket
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('property-images')
          .upload(watermarkedFilename, watermarkedImageBuffer, {
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
        console.log(`Successfully processed image ${image.id} -> ${publicUrlData.publicUrl}`);
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

async function ensureLogoInStorage(supabase: any, supabaseUrl: string) {
  try {
    const logoPath = 'city-market-logo.png';
    
    // Check if logo exists
    const { data: logoExists } = await supabase
      .storage
      .from('property-images')
      .list('', { search: logoPath });

    if (logoExists && logoExists.length > 0) {
      console.log('Logo already exists in storage');
      return;
    }

    console.log('Logo not found in storage, uploading...');

    // Try to fetch logo from public folder
    const publicLogoPath = '/images/city-market-logo.png';
    const logoUrl = `${supabaseUrl}${publicLogoPath}`;
    
    console.log(`Fetching logo from: ${logoUrl}`);
    
    const logoResponse = await fetch(logoUrl);
    if (!logoResponse.ok) {
      throw new Error(`Failed to fetch logo from public folder: ${logoResponse.statusText}`);
    }

    const logoBlob = await logoResponse.blob();
    const logoBuffer = await logoBlob.arrayBuffer();

    // Upload to storage
    const { error: uploadError } = await supabase
      .storage
      .from('property-images')
      .upload(logoPath, logoBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    console.log('Logo uploaded successfully to storage');
  } catch (error) {
    console.error('Error ensuring logo in storage:', error);
    throw new Error(`Logo upload failed: ${error.message}. Please manually upload city-market-logo.png to property-images bucket.`);
  }
}
