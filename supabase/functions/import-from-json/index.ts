import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    console.log('🚀 Starting import from JSON...');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the JSON file from storage
    console.log('📥 Downloading properties-unified-new.json from storage...');
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('data-import')
      .download('properties-unified-new.json');

    if (downloadError) {
      console.error('❌ Error downloading file:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Parse the JSON
    const jsonText = await fileData.text();
    const jsonData = JSON.parse(jsonText);
    
    console.log(`📊 Found ${jsonData.properties.length} properties in file`);

    // Process each property
    const results = {
      total: jsonData.properties.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const property of jsonData.properties) {
      try {
        // Transform property data to match database schema
        const dbProperty = {
          address: property.address,
          city: property.city || 'תל אביב-יפו',
          owner_name: property.owner_name,
          owner_phone: property.owner_phone,
          notes: property.notes,
          status: property.status || 'unknown',
          contact_status: 'not_contacted',
          contact_attempts: 0,
          rooms: property.rooms
        };

        // Insert into database
        const { error: insertError } = await supabase
          .from('properties')
          .insert(dbProperty);

        if (insertError) {
          console.error(`❌ Failed to insert property ${property.address}:`, insertError);
          results.failed++;
          results.errors.push(`${property.address}: ${insertError.message}`);
        } else {
          console.log(`✅ Successfully inserted: ${property.address}`);
          results.successful++;
        }
      } catch (error) {
        console.error(`❌ Error processing property ${property.address}:`, error);
        results.failed++;
        results.errors.push(`${property.address}: ${error.message}`);
      }
    }

    console.log(`✅ Import completed: ${results.successful} successful, ${results.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in import function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
