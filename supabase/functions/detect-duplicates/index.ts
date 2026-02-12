import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const BATCH_SIZE = 500;
  const TASK_NAME = 'dedup-scan';

  try {
    // Get total unchecked count for progress tracking
    const { count: totalUnchecked } = await supabase
      .from('scouted_properties')
      .select('id', { count: 'exact', head: true })
      .is('dedup_checked_at', null);

    // Upsert progress record
    await supabase
      .from('backfill_progress')
      .upsert({
        task_name: TASK_NAME,
        status: 'running',
        started_at: new Date().toISOString(),
        total_items: totalUnchecked ?? 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'task_name' });

    let totalProcessed = 0;
    let totalDuplicates = 0;
    let totalGroups = 0;
    let batchCount = 0;

    // Loop: call RPC batch by batch until nothing left
    while (true) {
      batchCount++;
      const { data, error } = await supabase.rpc('detect_duplicates_batch', {
        batch_size: BATCH_SIZE,
      });

      if (error) {
        console.error(`Batch ${batchCount} error:`, error.message);
        throw error;
      }

      const result = data?.[0] || data;
      const processed = result?.properties_processed ?? 0;
      const duplicates = result?.duplicates_found ?? 0;
      const groups = result?.groups_created ?? 0;

      totalProcessed += processed;
      totalDuplicates += duplicates;
      totalGroups += groups;

      console.log(`Batch ${batchCount}: processed=${processed}, duplicates=${duplicates}, groups=${groups}, total=${totalProcessed}`);

      // Update progress after each batch
      await supabase
        .from('backfill_progress')
        .update({
          processed_items: totalProcessed,
          successful_items: totalDuplicates,
          summary_data: { duplicates_found: totalDuplicates, groups_created: totalGroups, batches: batchCount },
          updated_at: new Date().toISOString(),
        })
        .eq('task_name', TASK_NAME);

      // If batch returned 0 processed, we're done
      if (processed === 0) {
        break;
      }

      // Safety: if we've been running too long (> 50 seconds), self-trigger and exit
      if (batchCount >= 10) {
        console.log(`Self-triggering after ${batchCount} batches (${totalProcessed} processed)`);

        // Self-trigger
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        fetch(`${supabaseUrl}/functions/v1/detect-duplicates`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ continuation: true }),
        }).catch(err => console.error('Self-trigger failed:', err));

        return new Response(JSON.stringify({
          status: 'continuing',
          processed: totalProcessed,
          duplicates_found: totalDuplicates,
          groups_created: totalGroups,
          batches: batchCount,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Done — mark complete
    await supabase
      .from('backfill_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_items: totalProcessed,
        successful_items: totalDuplicates,
        summary_data: { duplicates_found: totalDuplicates, groups_created: totalGroups, batches: batchCount },
        updated_at: new Date().toISOString(),
      })
      .eq('task_name', TASK_NAME);

    console.log(`Dedup scan complete: ${totalProcessed} processed, ${totalDuplicates} duplicates, ${totalGroups} new groups`);

    return new Response(JSON.stringify({
      status: 'completed',
      processed: totalProcessed,
      duplicates_found: totalDuplicates,
      groups_created: totalGroups,
      batches: batchCount,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Dedup scan error:', err);

    await supabase
      .from('backfill_progress')
      .update({
        status: 'failed',
        error_message: err.message,
        updated_at: new Date().toISOString(),
      })
      .eq('task_name', TASK_NAME);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
