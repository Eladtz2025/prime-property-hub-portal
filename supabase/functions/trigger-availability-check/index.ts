import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Fetch all active property IDs
    const { data: properties, error: fetchError } = await supabase
      .from('scouted_properties')
      .select('id')
      .eq('status', 'matched')
      .or('is_active.is.null,is_active.eq.true');

    if (fetchError) throw fetchError;

    if (!properties || properties.length === 0) {
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

    console.log(`📊 Found ${properties.length} properties to check`);

    // Split into batches of 50
    const batchSize = 50;
    const batches: string[][] = [];
    for (let i = 0; i < properties.length; i += batchSize) {
      batches.push(properties.slice(i, i + batchSize).map(p => p.id));
    }

    console.log(`📦 Split into ${batches.length} batches`);

    let triggeredCount = 0;
    const errors: string[] = [];

    // Trigger each batch with delay
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        console.log(`🚀 Triggering batch ${i + 1}/${batches.length} (${batch.length} properties)...`);
        
        const response = await fetch(`${supabaseUrl}/functions/v1/check-property-availability`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ property_ids: batch })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Batch ${i + 1} failed: ${errorText}`);
          errors.push(`Batch ${i + 1}: ${errorText}`);
        } else {
          triggeredCount++;
          const result = await response.json();
          console.log(`✅ Batch ${i + 1} completed: ${result.checked || 0} checked, ${result.marked_inactive || 0} inactive`);
        }
      } catch (error) {
        console.error(`❌ Error triggering batch ${i + 1}:`, error);
        errors.push(`Batch ${i + 1}: ${error.message}`);
      }

      // Delay between batches to avoid overwhelming the system
      if (i < batches.length - 1) {
        await sleep(2000);
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
