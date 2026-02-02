import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchCategorySettings } from "../_shared/settings.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Maximum batches per run to avoid timeout (Edge Function limit is 60s)
const MAX_BATCHES_PER_RUN = 2;
const DELAY_BETWEEN_BATCHES_MS = 30000; // 30 seconds between batches to let Firecrawl finish

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

    console.log(`⚙️ Settings: batchSize=${batchSize}, maxBatchesPerRun=${MAX_BATCHES_PER_RUN}`);

    // Check if we received property_ids from a previous self-trigger
    let propertyIds: string[] = [];
    try {
      const body = await req.json();
      if (body.property_ids && Array.isArray(body.property_ids) && body.property_ids.length > 0) {
        propertyIds = body.property_ids;
        console.log(`📋 Received ${propertyIds.length} property IDs from self-trigger (continuation)`);
      }
    } catch {
      // No body - this is a fresh run, fetch all properties
    }

    let allProperties: { id: string }[] = [];

    if (propertyIds.length > 0) {
      // Use the provided IDs (continuation run)
      allProperties = propertyIds.map(id => ({ id }));
    } else {
      // Fresh run: Fetch ALL active property IDs using pagination
      const PAGE_SIZE = 1000;
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

    console.log(`📊 Processing ${allProperties.length} properties`);

    // Split into batches using configurable batch size
    const batches: string[][] = [];
    for (let i = 0; i < allProperties.length; i += batchSize) {
      batches.push(allProperties.slice(i, i + batchSize).map(p => p.id));
    }

    console.log(`📦 Split into ${batches.length} batches of up to ${batchSize} properties`);

    // Only process MAX_BATCHES_PER_RUN batches in this run
    const batchesToProcess = Math.min(batches.length, MAX_BATCHES_PER_RUN);
    let triggeredCount = 0;

    // Trigger limited batches - FIRE AND FORGET
    for (let i = 0; i < batchesToProcess; i++) {
      const batch = batches[i];
      
      console.log(`🚀 Triggering batch ${i + 1}/${batchesToProcess} (${batch.length} properties)...`);
      
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

      // Short delay between triggering batches
      if (i < batchesToProcess - 1) {
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    }

    // If there are remaining batches, trigger self with remaining IDs
    const remainingBatches = batches.slice(batchesToProcess);
    if (remainingBatches.length > 0) {
      const remainingIds = remainingBatches.flat();
      console.log(`🔄 ${remainingBatches.length} batches remaining (${remainingIds.length} properties). Triggering self-continuation...`);
      
      // Fire and forget self-trigger
      fetch(`${supabaseUrl}/functions/v1/trigger-availability-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ property_ids: remainingIds })
      }).then(response => {
        if (!response.ok) {
          console.error(`❌ Self-trigger returned error status: ${response.status}`);
        } else {
          console.log(`✅ Self-trigger dispatched for ${remainingIds.length} remaining properties`);
        }
      }).catch(error => {
        console.error(`❌ Error in self-trigger:`, error.message);
      });
    }

    console.log(`✅ Orchestration run complete: ${triggeredCount} batches triggered, ${remainingBatches.length} batches remaining`);

    return new Response(JSON.stringify({
      success: true,
      total_properties: allProperties.length,
      batches_triggered: triggeredCount,
      total_batches: batches.length,
      remaining_batches: remainingBatches.length,
      will_continue: remainingBatches.length > 0
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
