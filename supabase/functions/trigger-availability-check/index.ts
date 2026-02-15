import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchCategorySettings, isPastEndTime } from "../_shared/settings.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Maximum batches per run - cron will trigger next run
const MAX_BATCHES_PER_RUN = 3;

// Timeout for batch processing (110 seconds - leaves margin before Edge Function timeout)
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

    console.log(`🔍 Starting availability check (${isManual ? 'manual' : 'cron-based'})...`);

    // Fire-and-forget cleanup of stuck runs before starting
    fetch(`${supabaseUrl}/functions/v1/cleanup-stuck-runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }).catch(err => console.error('⚠️ Cleanup-stuck-runs failed:', err));

    // === LOCK CHECK: Prevent parallel runs ===
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
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
        // Manual overrides cron: upgrade the existing run to manual
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

    // Fetch availability settings from database
    const settings = await fetchCategorySettings(supabase, 'availability');
    const batchSize = settings.batch_size;
    const minDaysBeforeCheck = settings.min_days_before_check;
    const firstRecheckDays = settings.first_recheck_interval_days || 8;
    const recurringRecheckDays = settings.recurring_recheck_interval_days || 2;

    console.log(`⚙️ Settings: batchSize=${batchSize}, firstRecheck=${firstRecheckDays}d, recurringRecheck=${recurringRecheckDays}d`);

    const fetchLimit = batchSize * (MAX_BATCHES_PER_RUN + 1);

    console.log(`📊 Fetching up to ${fetchLimit} properties`);

    // Fetch properties using smart recheck RPC
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
      // Release lock when no properties found
      await supabase
        .from('availability_check_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), properties_checked: 0 })
        .eq('id', runId);
      return new Response(JSON.stringify({
        success: true,
        message: 'No properties need checking',
        properties_found: 0,
        properties_found: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📦 Found ${propertyIds.length} properties to check`);

    // Split into batches
    const batches: string[][] = [];
    for (let i = 0; i < propertyIds.length; i += batchSize) {
      batches.push(propertyIds.slice(i, i + batchSize));
    }

    console.log(`📦 Split into ${batches.length} batches of up to ${batchSize} properties`);

    // Process batches sequentially (max 3 per run)
    const batchesToProcess = Math.min(batches.length, MAX_BATCHES_PER_RUN);
    let processedThisRun = 0;
    let inactiveThisRun = 0;
    let failedBatches = 0;
    const allRunDetails: any[] = [];

    for (let i = 0; i < batchesToProcess; i++) {
      const batch = batches[i];
      
      console.log(`🚀 Processing batch ${i + 1}/${batchesToProcess} (${batch.length} properties)...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/check-property-availability`, {
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
          
          // Collect run details from batch results
          if (result.results && Array.isArray(result.results)) {
            allRunDetails.push(...result.results);
            
            // Check if Firecrawl ran out of credits (402)
            const paymentRequired = result.results.some((r: any) => r.reason === 'firecrawl_payment_required');
            if (paymentRequired) {
              console.error(`🚫 Firecrawl out of credits (402)! Stopping run immediately.`);
              // Mark run as failed with clear message
              await supabase
                .from('availability_check_runs')
                .update({
                  status: 'failed',
                  completed_at: new Date().toISOString(),
                  properties_checked: processedThisRun,
                  inactive_marked: inactiveThisRun,
                  run_details: allRunDetails,
                  error_message: 'Firecrawl credits exhausted (402 Payment Required). Please check your Firecrawl account.'
                })
                .eq('id', runId);
              
              return new Response(JSON.stringify({
                success: false,
                error: 'firecrawl_payment_required',
                message: 'Firecrawl credits exhausted. Run stopped.',
                run_id: runId,
                processed_this_run: processedThisRun,
              }), {
                status: 402,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
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

      // Delay between batches
      if (i < batchesToProcess - 1) {
        await sleep(settings.delay_between_batches_ms);
      }
    }

    const remainingBatches = batches.length - batchesToProcess;

    // Log summary
    console.log(`📊 RUN SUMMARY:`);
    console.log(`   - Properties in queue: ${propertyIds.length}`);
    console.log(`   - Batches attempted: ${batchesToProcess}`);
    console.log(`   - Batches failed: ${failedBatches}`);
    console.log(`   - Processed this run: ${processedThisRun}`);
    console.log(`   - Inactive marked: ${inactiveThisRun}`);
    console.log(`   - Remaining batches: ${remainingBatches}`);
    

    console.log(`✅ Run batches complete: ${processedThisRun} processed`);

    // Self-chain decision: check status and schedule BEFORE marking completed

    // Check if run was stopped by user or upgraded to manual
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

    const shouldSelfChain = !wasStopped && remainingBatches > 0 && !endTimeReached;

    // NOW mark as completed (after self-chain decision, so stop button can catch 'running' status)
    if (!wasStopped) {
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

    if (wasStopped) {
      console.log('🛑 Run was stopped by user, not self-chaining');
    } else if (shouldSelfChain) {
      console.log(`🔄 Self-chaining: ${remainingBatches} batches remaining`);
      await sleep(3000);
      fetch(`${supabaseUrl}/functions/v1/trigger-availability-check`, {
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
      inactive_this_run: inactiveThisRun,
      failed_batches: failedBatches,
      remaining_in_queue: remainingBatches > 0 ? remainingBatches * batchSize : 0,
      self_chained: shouldSelfChain,
      next_run: shouldSelfChain ? 'self-chaining now' : 'backlog cleared'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Availability check error:', error);
    
    // Release lock on error
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
