import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchCategorySettings } from "../_shared/settings.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 Starting availability check orchestration...');

    // Fetch availability settings from database
    const availabilitySettings = await fetchCategorySettings(supabase, 'availability');
    const batchSize = availabilitySettings.batch_size;
    const delayBetweenBatches = availabilitySettings.delay_between_batches_ms;

    console.log(`⚙️ Settings: batchSize=${batchSize}, delayBetweenBatches=${delayBetweenBatches}ms`);

    // Fetch ALL active property IDs using pagination (Supabase limits to 1000 by default)
    const PAGE_SIZE = 1000;
    let allProperties: { id: string }[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: properties, error: fetchError } = await supabase
        .from('scouted_properties')
        .select('id')
        .eq('status', 'matched')
        .or('is_active.is.null,is_active.eq.true')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) throw fetchError;

      if (properties && properties.length > 0) {
        allProperties = [...allProperties, ...properties];
        page++;
        hasMore = properties.length === PAGE_SIZE;
        console.log(`📄 Fetched page ${page}: ${properties.length} properties (total so far: ${allProperties.length})`);
      } else {
        hasMore = false;
      }
    }

    if (allProperties.length === 0) {
      console.log('✅ No properties to check');
      return new Response(JSON.stringify({
        success: true,
        message: 'No properties to check',
        total_properties: 0,
        batches_triggered: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const properties = allProperties;

    console.log(`📊 Found ${properties.length} properties to check`);

    // Split into batches using configurable batch size
    const batches: string[][] = [];
    for (let i = 0; i < properties.length; i += batchSize) {
      batches.push(properties.slice(i, i + batchSize).map(p => p.id));
    }

    console.log(`📦 Split into ${batches.length} batches of up to ${batchSize} properties`);

    let triggeredCount = 0;
    const errors: string[] = [];

    // Trigger each batch with delay - FIRE AND FORGET (no await on response)
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      console.log(`🚀 Triggering batch ${i + 1}/${batches.length} (${batch.length} properties)...`);
      
      // Fire and forget - don't await the response
      fetch(`${supabaseUrl}/functions/v1/check-property-availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ property_ids: batch })
      }).then(response => {
        if (!response.ok) {
          console.error(`❌ Batch ${i + 1} returned error status: ${response.status}`);
        } else {
          console.log(`✅ Batch ${i + 1} triggered successfully`);
        }
      }).catch(error => {
        console.error(`❌ Error triggering batch ${i + 1}:`, error.message);
      });

      triggeredCount++;

      // Configurable delay between triggering batches to spread the load
      if (i < batches.length - 1) {
        await sleep(delayBetweenBatches);
      }
    }

    console.log(`✅ Availability check orchestration complete: ${triggeredCount}/${batches.length} batches triggered`);

    return new Response(JSON.stringify({
      success: true,
      total_properties: properties.length,
      batches_triggered: triggeredCount,
      total_batches: batches.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Availability check orchestration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
