import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchCategorySettings } from "../_shared/settings.ts";

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
    console.log('🔍 Starting availability check (cron-based)...');

    // === LOCK CHECK: Prevent parallel runs ===
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: runningCheck } = await supabase
      .from('availability_check_runs')
      .select('id, started_at')
      .eq('status', 'running')
      .gt('started_at', tenMinutesAgo)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (runningCheck) {
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
      .insert({ status: 'running' })
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
    const dailyLimit = settings.daily_limit;
    const recheckIntervalDays = settings.recheck_interval_days;
    const minDaysBeforeCheck = settings.min_days_before_check;

    console.log(`⚙️ Settings: batchSize=${batchSize}, dailyLimit=${dailyLimit}, recheckDays=${recheckIntervalDays}`);

    // Check how many we've processed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount } = await supabase
      .from('scouted_properties')
      .select('*', { count: 'exact', head: true })
      .gte('availability_checked_at', today.toISOString());

    const processedToday = todayCount || 0;
    console.log(`📊 Already processed today: ${processedToday}/${dailyLimit}`);

    // Check if we've hit daily limit
    if (processedToday >= dailyLimit) {
      console.log(`✅ Daily limit reached (${dailyLimit}). Stopping.`);
      // Release lock
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

    // Calculate cutoff dates
    const minDaysAgo = new Date();
    minDaysAgo.setDate(minDaysAgo.getDate() - minDaysBeforeCheck);

    const recheckCutoff = new Date();
    recheckCutoff.setDate(recheckCutoff.getDate() - recheckIntervalDays);

    // Remaining quota for today
    const remainingQuota = dailyLimit - processedToday;
    const fetchLimit = Math.min(remainingQuota, batchSize * MAX_BATCHES_PER_RUN);

    console.log(`📊 Fetching up to ${fetchLimit} properties (quota remaining: ${remainingQuota})`);

    // Fetch properties that need checking
    // Prioritize: unchecked properties first (NULL), then oldest checked
    const { data: properties, error: fetchError } = await supabase
      .from('scouted_properties')
      .select('id')
      .eq('is_active', true)
      .in('status', ['matched', 'new'])
      .lt('first_seen_at', minDaysAgo.toISOString())
      .or(`availability_checked_at.is.null,availability_checked_at.lt.${recheckCutoff.toISOString()}`)
      .order('availability_checked_at', { ascending: true, nullsFirst: true })
      .limit(fetchLimit);

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
        processed_today: processedToday,
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
    console.log(`   - Daily limit remaining: ${remainingQuota - processedThisRun}`);

    // Release lock - mark as completed with run details
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

    console.log(`✅ Run complete: ${processedThisRun} processed, lock released`);

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      processed_this_run: processedThisRun,
      processed_today: processedToday + processedThisRun,
      inactive_this_run: inactiveThisRun,
      failed_batches: failedBatches,
      remaining_in_queue: remainingBatches > 0 ? remainingBatches * batchSize : 0,
      daily_limit: dailyLimit,
      next_run: remainingBatches > 0 ? 'cron will continue in 10 minutes' : 'backlog cleared'
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
