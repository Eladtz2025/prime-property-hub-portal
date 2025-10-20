import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { appUrl } = await req.json();
    const baseAppUrl = appUrl || 'https://jswumsdymlooeobrxict.lovableproject.com';

    console.log(`Starting migration from ${baseAppUrl} to Supabase Storage`);

    // Get all images with relative paths
    const { data: images, error: fetchError } = await supabase
      .from('property_images')
      .select('id, image_url, property_id')
      .like('image_url', '/images/%');

    if (fetchError) {
      throw new Error(`Failed to fetch images: ${fetchError.message}`);
    }

    const result: MigrationResult = {
      total: images?.length || 0,
      migrated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    if (!images || images.length === 0) {
      console.log('No images to migrate');
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process each image
    for (const image of images) {
      try {
        console.log(`Processing image ${image.id}: ${image.image_url}`);

        // Construct full URL from public folder
        const fullUrl = `${baseAppUrl}${image.image_url}`;
        console.log(`Fetching from: ${fullUrl}`);

        // Fetch the image from public folder
        const imageResponse = await fetch(fullUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }

        const imageBlob = await imageResponse.blob();
        const imageData = await imageBlob.arrayBuffer();

        // Extract filename from path
        const filename = image.image_url.split('/').pop() || 'image.jpg';
        const storagePath = `${image.property_id}/${Date.now()}_${filename}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(storagePath, imageData, {
            contentType: imageBlob.type || 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(uploadData.path);

        // Update database record
        const { error: updateError } = await supabase
          .from('property_images')
          .update({ image_url: urlData.publicUrl })
          .eq('id', image.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        console.log(`Successfully migrated image ${image.id}`);
        result.migrated++;
      } catch (error: any) {
        console.error(`Failed to process image ${image.id}:`, error);
        result.failed++;
        result.errors.push(`Failed to migrate ${image.image_url}: ${error.message}`);
      }
    }

    console.log('Migration completed', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
