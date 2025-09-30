import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting properties JSON upload process...');

    // Read the properties-unified.json from the project's public directory
    const response = await fetch('https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/data-import/properties-unified.json');
    
    if (!response.ok) {
      console.log('Current file not found in storage, will create new one');
    }

    // For now, we'll expect the JSON data to be sent in the request body
    const jsonData = await req.text();
    
    if (!jsonData) {
      throw new Error('No JSON data provided in request body');
    }

    console.log('JSON data received, length:', jsonData.length);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('data-import')
      .upload('properties-unified.json', new Blob([jsonData], { type: 'application/json' }), {
        upsert: true, // This will overwrite the existing file
        contentType: 'application/json'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('File uploaded successfully:', uploadData);

    // Verify the upload
    const { data: listData, error: listError } = await supabase.storage
      .from('data-import')
      .list('', {
        limit: 10,
        search: 'properties-unified.json'
      });

    if (listError) {
      console.error('List error:', listError);
    } else {
      console.log('Files in bucket:', listData);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Properties JSON uploaded successfully',
      uploadData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error uploading properties JSON:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});