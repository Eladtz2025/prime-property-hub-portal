import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { fetchCategorySettings, isPastEndTime } from '../_shared/settings.ts';

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
    // Parse request body
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch { /* no body */ }

    const isReset = body.reset === true;
    const isContinuation = body.continuation === true;

    // If reset requested (manual run), clear all dedup_checked_at
    if (isReset && !isContinuation) {
      console.log('Reset requested — clearing all dedup_checked_at');
      const { error: resetErr } = await supabase.rpc('reset_dedup_checked');
      if (resetErr) {
        console.error('Reset failed:', resetErr.message);
        throw resetErr;
      }
    }

    // Get total unchecked count for progress tracking
    const { count: totalUnchecked } = await supabase
      .from('scouted_properties')
      .select('id', { count: 'exact', head: true })
      .is('dedup_checked_at', null)
      .eq('is_active', true);

    // Get total active for context
    const { count: totalActive } = await supabase
      .from('scouted_properties')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    // Upsert progress record
    if (!isContinuation) {
      await supabase
        .from('backfill_progress')
        .upsert({
          task_name: TASK_NAME,
          status: 'running',
          started_at: new Date().toISOString(),
          total_items: totalUnchecked ?? 0,
          processed_items: 0,
          successful_items: 0,
          failed_items: 0,
          summary_data: {
            duplicates_found: 0,
            groups_created: 0,
            batches: 0,
            skipped: 0,
            total_active: totalActive ?? 0,
            recent_batches: [],
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'task_name' });
    } else {
      // Just update status to running in case
      await supabase
        .from('backfill_progress')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('task_name', TASK_NAME);
    }

    let totalProcessed = 0;
    let totalDuplicates = 0;
    let totalGroups = 0;
    let totalSkipped = 0;
    let batchCount = 0;

    // Read existing cumulative values if continuation
    if (isContinuation) {
      const { data: existing } = await supabase
        .from('backfill_progress')
        .select('processed_items, successful_items, summary_data')
        .eq('task_name', TASK_NAME)
        .maybeSingle();
      if (existing) {
        totalProcessed = existing.processed_items ?? 0;
        totalDuplicates = existing.successful_items ?? 0;
        const sd = existing.summary_data as Record<string, unknown> | null;
        totalGroups = (sd?.groups_created as number) ?? 0;
        totalSkipped = (sd?.skipped as number) ?? 0;
        batchCount = (sd?.batches as number) ?? 0;
      }
    }

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
      const skipped = result?.properties_skipped ?? 0;

      totalProcessed += processed;
      totalDuplicates += duplicates;
      totalGroups += groups;
      totalSkipped += skipped;

      console.log(`Batch ${batchCount}: processed=${processed}, duplicates=${duplicates}, groups=${groups}, skipped=${skipped}, total=${totalProcessed}`);

      // Read existing summary_data to preserve recent_batches
      const { data: progressRow } = await supabase
        .from('backfill_progress')
        .select('summary_data')
        .eq('task_name', TASK_NAME)
        .maybeSingle();

      const existingSummary = (progressRow?.summary_data as Record<string, unknown>) || {};
      const recentBatches = Array.isArray(existingSummary.recent_batches)
        ? [...(existingSummary.recent_batches as Array<Record<string, unknown>>)]
        : [];

      recentBatches.push({
        batch: batchCount,
        processed,
        duplicates,
        groups,
        skipped,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 10
      if (recentBatches.length > 10) recentBatches.splice(0, recentBatches.length - 10);

      // Update progress after each batch
      await supabase
        .from('backfill_progress')
        .update({
          processed_items: totalProcessed,
          successful_items: totalDuplicates,
          failed_items: totalSkipped,
          summary_data: {
            duplicates_found: totalDuplicates,
            groups_created: totalGroups,
            batches: batchCount,
            skipped: totalSkipped,
            total_active: totalActive ?? 0,
            recent_batches: recentBatches,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('task_name', TASK_NAME);

      // If batch returned 0 processed, we're done
      if (processed === 0) {
        break;
      }

      // Safety: if we've been running too long (> 50 seconds), self-trigger and exit
      if (batchCount >= 10) {
        // Check end time before self-chaining
        let endTimeReached = false;
        try {
          const dedupSettings = await fetchCategorySettings(supabase, 'duplicates');
          endTimeReached = isPastEndTime(dedupSettings.schedule_end_time);
        } catch (e) {
          console.warn('Failed to check end time:', e);
        }

        if (endTimeReached) {
          console.log(`⏰ End time reached — stopping after ${batchCount} batches (${totalProcessed} processed)`);
          await supabase
            .from('backfill_progress')
            .update({
              status: 'stopped',
              completed_at: new Date().toISOString(),
              summary_data: {
                ...((await supabase.from('backfill_progress').select('summary_data').eq('task_name', TASK_NAME).maybeSingle()).data?.summary_data as Record<string, unknown> || {}),
                duplicates_found: totalDuplicates,
                groups_created: totalGroups,
                batches: batchCount,
                skipped: totalSkipped,
                stopped_reason: 'end_time_reached',
              },
              updated_at: new Date().toISOString(),
            })
            .eq('task_name', TASK_NAME);

          return new Response(JSON.stringify({
            status: 'stopped',
            reason: 'end_time_reached',
            processed: totalProcessed,
            duplicates_found: totalDuplicates,
            groups_created: totalGroups,
            skipped: totalSkipped,
            batches: batchCount,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        console.log(`Self-triggering after ${batchCount} batches (${totalProcessed} processed)`);

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
          skipped: totalSkipped,
          batches: batchCount,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Done — mark complete
    const { data: finalRow } = await supabase
      .from('backfill_progress')
      .select('summary_data')
      .eq('task_name', TASK_NAME)
      .maybeSingle();

    const finalSummary = (finalRow?.summary_data as Record<string, unknown>) || {};

    await supabase
      .from('backfill_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_items: totalProcessed,
        successful_items: totalDuplicates,
        failed_items: totalSkipped,
        summary_data: {
          ...finalSummary,
          duplicates_found: totalDuplicates,
          groups_created: totalGroups,
          batches: batchCount,
          skipped: totalSkipped,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('task_name', TASK_NAME);

    console.log(`Dedup scan complete: ${totalProcessed} processed, ${totalDuplicates} duplicates, ${totalGroups} new groups, ${totalSkipped} skipped`);

    // Fire-and-forget: cleanup orphan duplicate groups after dedup completes
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    fetch(`${supabaseUrl}/functions/v1/cleanup-orphan-duplicates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }).catch(err => console.error('⚠️ Cleanup orphan duplicates failed:', err));
    console.log('🧹 Triggered cleanup-orphan-duplicates after dedup completion');

    return new Response(JSON.stringify({
      status: 'completed',
      processed: totalProcessed,
      duplicates_found: totalDuplicates,
      groups_created: totalGroups,
      skipped: totalSkipped,
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
