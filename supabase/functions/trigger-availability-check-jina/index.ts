// trigger-availability-check-jina v1.0
// Copy of trigger-availability-check that calls check-property-availability-jina instead
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchCategorySettings, isPastEndTime } from "../_shared/settings.ts";
import { isProcessEnabled } from '../_shared/process-flags.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_BATCHES_PER_RUN = 5;
const BATCH_TIMEOUT_MS = 110000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let runId: string | null = null;

  try {
    const { manual, continue_run } = await req.json().catch(() => ({}));
    const isManual = manual === true;

    // Kill switch check (skip for manual runs)
    if (!isManual && !continue_run && !await isProcessEnabled(supabase, 'availability_jina')) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Process disabled via kill switch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Starting availability check JINA (${isManual ? 'manual' : 'cron-based'})...`);

    // Await cleanup of stuck runs before lock check to avoid race conditions
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

    // === AUTO-CLEANUP: Mark stuck runs (>15min) as failed ===
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: stuckCleanup } = await supabase
      .from('availability_check_runs')
      .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: 'Auto-cleanup: stuck > 5min' })
      .eq('status', 'running')
      .lt('started_at', fiveMinutesAgo)
      .select('id');
    
    if (stuckCleanup && stuckCleanup.length > 0) {
      console.log(`🧹 Auto-cleaned ${stuckCleanup.length} stuck runs: ${stuckCleanup.map(r => r.id).join(', ')}`);
    }

    // === LOCK CHECK: Prevent parallel runs ===
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: runningCheck } = await supabase
      .from('availability_check_runs')
      .select('id, started_at, is_manual')
      .eq('status', 'running')
      .gt('started_at', tenMinutesAgo)
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
          success: true,
          message: 'Upgraded existing run to manual',
          run_id: runningCheck.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const runAge = (Date.now() - new Date(runningCheck.started_at).getTime()) / 1000;
      console.log(`⏳ Already running: ${runningCheck.id} (${runAge.toFixed(0)}s ago). Skipping.`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Already running',
        running_since: runningCheck.started_at,
        run_id: runningCheck.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create new run record (claim the lock)
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

    const settings = await fetchCategorySettings(supabase, 'availability');
    const batchSize = settings.batch_size;
    const dailyLimit = settings.daily_limit;
    const minDaysBeforeCheck = settings.min_days_before_check;
    const firstRecheckDays = settings.first_recheck_interval_days || 8;
    const recurringRecheckDays = settings.recurring_recheck_interval_days || 2;

    console.log(`⚙️ Settings: batchSize=${batchSize}, dailyLimit=${dailyLimit}, firstRecheck=${firstRecheckDays}d, recurringRecheck=${recurringRecheckDays}d`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount } = await supabase
      .from('scouted_properties')
      .select('*', { count: 'exact', head: true })
      .gte('availability_checked_at', today.toISOString());

    const processedToday = todayCount || 0;
    console.log(`📊 Already processed today: ${processedToday}/${dailyLimit}`);

    if (processedToday >= dailyLimit) {
      console.log(`✅ Daily limit reached (${dailyLimit}). Stopping.`);
      await supabase
        .from('availability_check_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), properties_checked: 0 })
        .eq('id', runId);
      return new Response(JSON.stringify({
        success: true,
        message: 'Daily limit reached',
        processed_today: processedToday,
        daily_limit: dailyLimit
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const remainingQuota = dailyLimit - processedToday;
    const fetchLimit = Math.min(remainingQuota, batchSize * (MAX_BATCHES_PER_RUN + 1));

    console.log(`📊 Fetching up to ${fetchLimit} properties (quota remaining: ${remainingQuota})`);

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
      console.log('✅ No properties need checking');
      await supabase
        .from('availability_check_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), properties_checked: 0 })
        .eq('id', runId);
      return new Response(JSON.stringify({
        success: true,
        message: 'No properties need checking',
        processed_today: processedToday,
        properties_found: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📦 Found ${propertyIds.length} properties to check`);

    const batches: string[][] = [];
    for (let i = 0; i < propertyIds.length; i += batchSize) {
      batches.push(propertyIds.slice(i, i + batchSize));
    }

    console.log(`📦 Split into ${batches.length} batches of up to ${batchSize} properties`);

    const batchesToProcess = Math.min(batches.length, MAX_BATCHES_PER_RUN);
    let processedThisRun = 0;
    let inactiveThisRun = 0;
    let failedBatches = 0;
    const allRunDetails: any[] = [];

    for (let i = 0; i < batchesToProcess; i++) {
      const batch = batches[i];

      // Check if run was stopped between batches
      if (i > 0) {
        const { data: midCheck } = await supabase
          .from('availability_check_runs')
          .select('status')
          .eq('id', runId)
          .single();
        if (midCheck?.status === 'stopped') {
          console.log(`🛑 Run stopped by user before batch ${i + 1}. Exiting.`);
          break;
        }
      }
      
      console.log(`🚀 Processing batch ${i + 1}/${batchesToProcess} (${batch.length} properties)...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);
      
      try {
        // THIS IS THE ONLY DIFFERENCE: calling check-property-availability-jina
        const response = await fetch(`${supabaseUrl}/functions/v1/check-property-availability-jina`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ property_ids: batch, run_id: runId })
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Batch ${i + 1} completed: ${result.checked} checked, ${result.marked_inactive} inactive`);
          processedThisRun += result.checked || batch.length;
          inactiveThisRun += result.marked_inactive || 0;
          
          if (result.results && Array.isArray(result.results)) {
            allRunDetails.push(...result.results);
          }
        } else {
          console.error(`❌ Batch ${i + 1} error status: ${response.status}`);
          failedBatches++;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`⏱️ Batch ${i + 1} timed out after ${BATCH_TIMEOUT_MS}ms`);
        } else {
          console.error(`❌ Batch ${i + 1} error:`, error instanceof Error ? error.message : 'Unknown');
        }
        failedBatches++;
      }

      if (i < batchesToProcess - 1) {
        await sleep(settings.delay_between_batches_ms);
      }
    }

    const remainingBatches = batches.length - batchesToProcess;

    console.log(`📊 RUN SUMMARY:`);
    console.log(`   - Properties in queue: ${propertyIds.length}`);
    console.log(`   - Batches attempted: ${batchesToProcess}`);
    console.log(`   - Batches failed: ${failedBatches}`);
    console.log(`   - Processed this run: ${processedThisRun}`);
    console.log(`   - Inactive marked: ${inactiveThisRun}`);
    console.log(`   - Remaining batches: ${remainingBatches}`);
    console.log(`   - Daily limit remaining: ${remainingQuota - processedThisRun}`);

    const remainingDailyQuota = remainingQuota - processedThisRun;

    const { data: currentRun } = await supabase
      .from('availability_check_runs')
      .select('status, is_manual')
      .eq('id', runId)
      .single();

    const wasStopped = currentRun?.status === 'stopped';
    const effectiveManual = isManual || currentRun?.is_manual === true;

    let endTimeReached = false;
    if (!effectiveManual && !wasStopped) {
      try {
        const availSettings = await fetchCategorySettings(supabase, 'availability');
        endTimeReached = isPastEndTime(availSettings.schedule_end_time);
      } catch (e) {
        console.warn('Failed to check end time:', e);
      }
    } else if (effectiveManual) {
      console.log('⏩ Manual run — skipping schedule_end_time check');
    }

    // Re-check stopped status right before deciding to self-chain
    let finalStopped = wasStopped;
    if (!wasStopped) {
      const { data: finalCheck } = await supabase
        .from('availability_check_runs')
        .select('status')
        .eq('id', runId)
        .single();
      finalStopped = finalCheck?.status === 'stopped';
    }

    const shouldSelfChain = !finalStopped && remainingBatches > 0 && remainingDailyQuota > 0 && !endTimeReached;

    if (!finalStopped) {
      await supabase
        .from('availability_check_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          properties_checked: processedThisRun,
          inactive_marked: inactiveThisRun,
          run_details: allRunDetails
        })
        .eq('id', runId);
    }

    if (finalStopped) {
      console.log('🛑 Run was stopped by user, not self-chaining');
    } else if (shouldSelfChain) {
      console.log(`🔄 Self-chaining: ${remainingBatches} batches remaining, ${remainingDailyQuota} daily quota left`);
      await sleep(3000);
      // Self-chain to THIS function (Jina version)
      fetch(`${supabaseUrl}/functions/v1/trigger-availability-check-jina`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ continue_run: true, manual: effectiveManual })
      }).catch(err => console.error('⚠️ Self-chain failed:', err));
    } else if (endTimeReached) {
      console.log(`⏰ End time reached, stopping self-chain. ${remainingBatches} batches remaining.`);
    }

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      processed_this_run: processedThisRun,
      processed_today: processedToday + processedThisRun,
      inactive_this_run: inactiveThisRun,
      failed_batches: failedBatches,
      remaining_in_queue: remainingBatches > 0 ? remainingBatches * batchSize : 0,
      daily_limit: dailyLimit,
      self_chained: remainingBatches > 0 && remainingDailyQuota > 0,
      next_run: remainingBatches > 0 && remainingDailyQuota > 0 ? 'self-chaining now' : remainingBatches > 0 ? 'daily limit reached' : 'backlog cleared'
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
