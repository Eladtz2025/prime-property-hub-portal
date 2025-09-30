import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyData {
  address: string;
  owner_name: string;
  owner_phone?: string;
  city: string;
  notes?: string;
  rooms?: number;
  monthly_rent?: number;
  status?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting property import process...');

    const { properties } = await req.json() as { properties: PropertyData[] };
    
    if (!properties || !Array.isArray(properties)) {
      throw new Error('Invalid properties data format');
    }

    console.log(`Processing ${properties.length} properties...`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      
      const propertiesToInsert = batch.map(prop => ({
        address: prop.address,
        city: prop.city || 'תל אביב-יפו',
        owner_name: prop.owner_name,
        owner_phone: prop.owner_phone || null,
        notes: prop.notes || null,
        rooms: prop.rooms || null,
        status: (prop.status || 'unknown') as 'unknown' | 'occupied' | 'vacant' | 'maintenance',
        contact_status: 'not_contacted' as const,
        contact_attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('properties')
        .insert(propertiesToInsert)
        .select();

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        errorCount += batch.length;
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        successCount += data?.length || 0;
        console.log(`Batch ${i / batchSize + 1} completed: ${data?.length} properties inserted`);
      }
    }

    console.log(`Import completed: ${successCount} successful, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      message: `Import completed: ${successCount} properties imported`,
      stats: {
        total: properties.length,
        successful: successCount,
        failed: errorCount,
        errors: errors.length > 0 ? errors : undefined
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in property import:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
