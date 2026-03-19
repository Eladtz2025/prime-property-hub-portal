// trigger-availability-check-jina v3.0
// Architecture: 1 batch per invocation + self-chain with run_id continuity + watchdog recovery
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchCategorySettings, isPastEndTime } from "../_shared/settings.ts";
import { isProcessEnabled } from '../_shared/process-flags.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Process exactly 1 batch per invocation to stay safely within Edge Function timeout
const MAX_BATCHES_PER_RUN = 1;
const BATCH_TIMEOUT_MS = 110000;
const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Self-chain with retry: await the fetch, and if it fails, retry once after 3s.
 */
async function selfChainWithRetry(
  supabaseUrl: string,
  supabaseServiceKey: string,
  runId: string,
  isManual: boolean
): Promise<void> {
  const triggerUrl = `${supabaseUrl}/functions/v1/trigger-availability-check-jina`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ continue_run: true, run_id: runId, manual: isManual }),
  };

  try {
    const resp = await fetch(triggerUrl, options);
    if (!resp.ok) {
      console.warn(`⚠️ Self-chain response ${resp.status}, retrying in 3s...`);
      throw new Error(`status ${resp.status}`);
    }
    console.log(`✅ Self-chain succeeded`);
  } catch (err) {
    console.warn(`⚠️ Self-chain attempt 1 failed: ${err instanceof Error ? err.message : err}. Retrying in 3s...`);
    await sleep(3000);
    try {
      const resp2 = await fetch(triggerUrl, options);
      if (!resp2.ok) {
        console.error(`❌ Self-chain retry also returned ${resp2.status}`);
      } else {
        console.log(`✅ Self-chain retry succeeded`);
      }
    } catch (err2) {
      console.error(`❌ Self-chain retry failed: ${err2 instanceof Error ? err2.message : err2}. Run ${runId} may be stuck.`);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let runId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    const { manual, continue_run, run_id: existingRunId, watchdog } = body;
    const isManual = manual === true;
    const isContinuation = continue_run === true && !!existingRunId;
    const isWatchdog = watchdog === true;

    // === WATCHDOG MODE: check for stuck runs and resume them ===
    if (isWatchdog) {
      const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();
      const { data: stuckRuns } = await supabase
        .from('availability_check_runs')
        .select('id, is_manual, started_at, properties_checked')
        .eq('status', 'running')
        .lt('started_at', cutoff)
        .order('started_at', { ascending: true })
        .limit(1);

      if (!stuckRuns || stuckRuns.length === 0) {
        return new Response(JSON.stringify({
          success: true, watchdog: true, message: 'No stuck runs found'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const stuckRun = stuckRuns[0];
      const stuckAge = Math.round((Date.now() - new Date(stuckRun.started_at).getTime()) / 1000);
      console.log(`🐕 Watchdog: Found stuck run ${stuckRun.id} (${stuckAge}s old, ${stuckRun.properties_checked || 0} checked). Resuming...`);

      // Resume by self-chaining
      await selfChainWithRetry(supabaseUrl, supabaseServiceKey, stuckRun.id, stuckRun.is_manual || false);

      return new Response(JSON.stringify({
        success: true, watchdog: true, resumed_run_id: stuckRun.id, stuck_age_seconds: stuckAge
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Kill switch check (skip for manual runs and continuations)
    if (!isManual && !isContinuation && !await isProcessEnabled(supabase, 'availability_jina')) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Process disabled via kill switch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Availability check JINA ${isContinuation ? `(continuation of ${existingRunId})` : `(${isManual ? 'manual' : 'cron-based'})`}...`);

    if (isContinuation) {
      // === CONTINUATION: reuse existing run record ===
      runId = existingRunId;

      // Check if run was stopped
      const { data: runCheck } = await supabase
        .from('availability_check_runs')
        .select('status, is_manual')
        .eq('id', runId)
        .single();

      if (!runCheck || runCheck.status === 'stopped') {
        console.log(`🛑 Run ${runId} was stopped or not found. Exiting.`);
        return new Response(JSON.stringify({ success: true, message: 'Run stopped', run_id: runId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (runCheck.status !== 'running') {
        console.log(`⚠️ Run ${runId} status is '${runCheck.status}', not 'running'. Exiting.`);
        return new Response(JSON.stringify({ success: true, message: 'Run not in running state', run_id: runId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update heartbeat timestamp
      await supabase
        .from('availability_check_runs')
        .update({ started_at: new Date().toISOString() })
        .eq('id', runId);

    } else {
      // === NEW RUN: cleanup + lock + create ===

      // Await cleanup of stuck runs
      try {
        await fetch(`${supabaseUrl}/functions/v1/cleanup-stuck-runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
      } catch (err) {
        console.error('⚠️ Cleanup-stuck-runs failed:', err);
      }

      // Auto-cleanup: stuck runs > 5min
      const fiveMinutesAgo = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();
      const { data: stuckCleanup } = await supabase
        .from('availability_check_runs')
        .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: 'Auto-cleanup: stuck > 5min' })
        .eq('status', 'running')
        .lt('started_at', fiveMinutesAgo)
        .select('id');
      
      if (stuckCleanup && stuckCleanup.length > 0) {
        console.log(`🧹 Auto-cleaned ${stuckCleanup.length} stuck runs: ${stuckCleanup.map(r => r.id).join(', ')}`);
      }

      // Lock check: prevent parallel runs
      const fiveMinAgo = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();
      const { data: runningCheck } = await supabase
        .from('availability_check_runs')
        .select('id, started_at, is_manual')
        .eq('status', 'running')
        .gt('started_at', fiveMinAgo)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (runningCheck) {
        if (isManual && !runningCheck.is_manual) {
          await supabase
            .from('availability_check_runs')
            .update({ is_manual: true })
            .eq('id', runningCheck.id);
          console.log(`🔄 Upgraded existing run ${runningCheck.id} to manual mode`);
          return new Response(JSON.stringify({
            success: true, message: 'Upgraded existing run to manual', run_id: runningCheck.id
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const runAge = (Date.now() - new Date(runningCheck.started_at).getTime()) / 1000;
        console.log(`⏳ Already running: ${runningCheck.id} (${runAge.toFixed(0)}s ago). Skipping.`);
        return new Response(JSON.stringify({
          success: true, message: 'Already running', running_since: runningCheck.started_at, run_id: runningCheck.id
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Create new run record
      const { data: newRun, error: insertError } = await supabase
        .from('availability_check_runs')
        .insert({ status: 'running', is_manual: isManual })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Failed to create run record:', insertError);
        throw insertError;
      }

      runId = newRun.id;
      console.log(`🔒 Created run lock: ${runId}`);
    }

    const settings = await fetchCategorySettings(supabase, 'availability');
    const batchSize = settings.batch_size;
    const dailyLimit = settings.daily_limit;
    const minDaysBeforeCheck = settings.min_days_before_check;
    const firstRecheckDays = settings.first_recheck_interval_days || 8;
    const recurringRecheckDays = settings.recurring_recheck_interval_days || 2;

    console.log(`⚙️ Settings: batchSize=${batchSize}, dailyLimit=${dailyLimit}`);

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount } = await supabase
      .from('scouted_properties')
      .select('*', { count: 'exact', head: true })
      .gte('availability_checked_at', today.toISOString());

    const processedToday = todayCount || 0;
    console.log(`📊 Already processed today: ${processedToday}/${dailyLimit}`);

    if (processedToday >= dailyLimit) {
      console.log(`✅ Daily limit reached (${dailyLimit}). Completing run.`);
      await supabase
        .from('availability_check_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', runId)
        .eq('status', 'running');
      return new Response(JSON.stringify({
        success: true, message: 'Daily limit reached', processed_today: processedToday, daily_limit: dailyLimit
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const remainingQuota = dailyLimit - processedToday;
    // Only fetch 1 batch worth of properties
    const fetchLimit = Math.min(remainingQuota, batchSize);

    console.log(`📊 Fetching up to ${fetchLimit} properties`);

    const { data: properties, error: fetchError } = await supabase
      .rpc('get_properties_needing_availability_check', {
        p_first_recheck_days: firstRecheckDays,
        p_recurring_recheck_days: recurringRecheckDays,
        p_min_days_before_check: minDaysBeforeCheck,
        p_fetch_limit: fetchLimit,
      });

    if (fetchError) throw fetchError;
    
    const propertyIds = properties?.map(p => p.id) || [];

    if (propertyIds.length === 0) {
      console.log('✅ No properties need checking. Completing run.');
      await supabase
        .from('availability_check_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', runId)
        .eq('status', 'running');
      return new Response(JSON.stringify({
        success: true, message: 'No properties need checking', run_id: runId, processed_today: processedToday
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`🚀 Processing batch of ${propertyIds.length} properties...`);

    let processedThisRun = 0;
    let inactiveThisRun = 0;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/check-property-availability-jina`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ property_ids: propertyIds, run_id: runId })
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Batch completed: ${result.checked} checked, ${result.marked_inactive} inactive`);
        processedThisRun = result.checked || propertyIds.length;
        inactiveThisRun = result.marked_inactive || 0;
      } else {
        console.error(`❌ Batch error status: ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏱️ Batch timed out after ${BATCH_TIMEOUT_MS}ms`);
      } else {
        console.error(`❌ Batch error:`, error instanceof Error ? error.message : 'Unknown');
      }
    }

    // Incrementally update run stats
    const { data: currentRunData } = await supabase
      .from('availability_check_runs')
      .select('status, is_manual, properties_checked, inactive_marked')
      .eq('id', runId)
      .single();

    const wasStopped = currentRunData?.status === 'stopped';
    const effectiveManual = isManual || currentRunData?.is_manual === true;
    const totalChecked = (currentRunData?.properties_checked || 0) + processedThisRun;
    const totalInactive = (currentRunData?.inactive_marked || 0) + inactiveThisRun;

    // Check schedule end time
    let endTimeReached = false;
    if (!effectiveManual && !wasStopped) {
      try {
        endTimeReached = isPastEndTime(settings.schedule_end_time);
      } catch (e) {
        console.warn('Failed to check end time:', e);
      }
    }

    // Determine if there are more properties to check
    const remainingDailyQuota = remainingQuota - processedThisRun;
    const hadFullBatch = propertyIds.length >= batchSize;
    const shouldSelfChain = !wasStopped && hadFullBatch && remainingDailyQuota > 0 && !endTimeReached;

    if (!wasStopped) {
      if (shouldSelfChain) {
        // Update stats but keep running for next chain
        await supabase
          .from('availability_check_runs')
          .update({
            properties_checked: totalChecked,
            inactive_marked: totalInactive,
            started_at: new Date().toISOString(), // heartbeat
          })
          .eq('id', runId)
          .eq('status', 'running');
      } else {
        // Final batch — mark completed
        await supabase
          .from('availability_check_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            properties_checked: totalChecked,
            inactive_marked: totalInactive,
          })
          .eq('id', runId)
          .eq('status', 'running');
      }
    }

    if (wasStopped) {
      console.log('🛑 Run was stopped by user, not self-chaining');
    } else if (shouldSelfChain) {
      console.log(`🔄 Self-chaining: ${totalChecked} checked so far, ${remainingDailyQuota} daily quota left`);
      await sleep(2000);
      await selfChainWithRetry(supabaseUrl, supabaseServiceKey, runId!, effectiveManual);
    } else if (endTimeReached) {
      console.log(`⏰ End time reached, stopping. ${totalChecked} total checked.`);
    } else {
      console.log(`✅ All properties checked. ${totalChecked} total.`);
    }

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      processed_this_batch: processedThisRun,
      total_checked: totalChecked,
      total_inactive: totalInactive,
      processed_today: processedToday + processedThisRun,
      daily_limit: dailyLimit,
      self_chained: shouldSelfChain,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Availability check error:', error);
    
    if (runId) {
      await supabase
        .from('availability_check_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', runId);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
