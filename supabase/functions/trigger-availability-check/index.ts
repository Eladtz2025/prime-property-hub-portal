import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchCategorySettings } from "../_shared/settings.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Maximum batches per run - process sequentially, then self-trigger for next
const MAX_BATCHES_PER_RUN = 10;

// Maximum retries per property before giving up
const MAX_RETRIES_PER_PROPERTY = 3;

// Timeout for batch processing (110 seconds - leaves margin before Edge Function timeout)
const BATCH_TIMEOUT_MS = 110000;

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
    const settings = await fetchCategorySettings(supabase, 'availability');
    const batchSize = settings.batch_size;
    const dailyLimit = settings.daily_limit;
    const recheckIntervalDays = settings.recheck_interval_days;
    const minDaysBeforeCheck = settings.min_days_before_check;

    console.log(`⚙️ Settings: batchSize=${batchSize}, dailyLimit=${dailyLimit}, recheckDays=${recheckIntervalDays}`);

    // Track how many we've processed in this run chain
    let processedInChain = 0;
    let retryIds: string[] = [];
    let retryCountMap: Record<string, number> = {};
    
    try {
      const body = await req.json();
      if (body.processed_count && typeof body.processed_count === 'number') {
        processedInChain = body.processed_count;
        console.log(`📋 Continuation run: already processed ${processedInChain} properties`);
      }
      // Handle retry_ids from previous failed batches
      if (body.retry_ids && Array.isArray(body.retry_ids) && body.retry_ids.length > 0) {
        retryIds = body.retry_ids;
        console.log(`🔄 Received ${retryIds.length} retry IDs from previous run`);
      }
      // Handle retry counts map
      if (body.retry_counts && typeof body.retry_counts === 'object') {
        retryCountMap = body.retry_counts;
      }
    } catch {
      // Fresh run - no body
    }

    // Check if we've hit daily limit
    if (processedInChain >= dailyLimit) {
      console.log(`✅ Daily limit reached (${dailyLimit}). Stopping.`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Daily limit reached',
        total_processed: processedInChain,
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

    // Remaining quota for this chain
    const remainingQuota = dailyLimit - processedInChain;
    const fetchLimit = Math.min(remainingQuota, batchSize * MAX_BATCHES_PER_RUN);

    // Filter out properties that exceeded max retries
    const validRetryIds = retryIds.filter(id => {
      const count = retryCountMap[id] || 0;
      if (count >= MAX_RETRIES_PER_PROPERTY) {
        console.log(`⛔ Property ${id} exceeded max retries (${count}), skipping permanently`);
        return false;
      }
      return true;
    });
    
    // Determine how many retry IDs we can process this run
    const retryIdsToProcess = validRetryIds.slice(0, fetchLimit);
    const remainingRetryIds = validRetryIds.slice(fetchLimit);
    
    if (remainingRetryIds.length > 0) {
      console.log(`📋 ${remainingRetryIds.length} retry IDs will be passed to next run`);
    }

    console.log(`📊 Fetching up to ${fetchLimit} properties (quota remaining: ${remainingQuota})`);

    let propertyIds: string[] = [];

    // PRIORITY 1: Process retry IDs first
    if (retryIdsToProcess.length > 0) {
      console.log(`🔄 Processing ${retryIdsToProcess.length} retry IDs first...`);
      propertyIds = retryIdsToProcess;
    } else {
      // PRIORITY 2: Fetch new properties from DB
      const newFetchLimit = fetchLimit - retryIdsToProcess.length;
      
      if (newFetchLimit > 0) {
        const { data: properties, error: fetchError } = await supabase
          .from('scouted_properties')
          .select('id')
          .eq('is_active', true)
          .in('status', ['matched', 'new'])
          .lt('first_seen_at', minDaysAgo.toISOString())
          .or(`availability_checked_at.is.null,availability_checked_at.lt.${recheckCutoff.toISOString()}`)
          .order('first_seen_at', { ascending: true })
          .limit(newFetchLimit);

        if (fetchError) throw fetchError;
        
        propertyIds = properties?.map(p => p.id) || [];
      }
    }

    if (propertyIds.length === 0 && remainingRetryIds.length === 0) {
      console.log('✅ No properties need checking');
      return new Response(JSON.stringify({
        success: true,
        message: 'No properties need checking',
        total_processed: processedInChain,
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

    // Process batches sequentially
    const batchesToProcess = Math.min(batches.length, MAX_BATCHES_PER_RUN);
    let processedThisRun = 0;
    let inactiveThisRun = 0;
    let failedBatches: string[][] = [];

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
          body: JSON.stringify({ property_ids: batch })
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Batch ${i + 1} completed: ${result.checked} checked, ${result.marked_inactive} inactive`);
          processedThisRun += result.checked || batch.length;
          inactiveThisRun += result.marked_inactive || 0;
        } else {
          console.error(`❌ Batch ${i + 1} error status: ${response.status}`);
          failedBatches.push(batch);
          // Increment retry count for failed IDs
          for (const id of batch) {
            retryCountMap[id] = (retryCountMap[id] || 0) + 1;
          }
          console.log(`🔄 Batch ${i + 1} added to retry queue (${batch.length} IDs)`);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`⏱️ Batch ${i + 1} timed out after ${BATCH_TIMEOUT_MS}ms`);
        } else {
          console.error(`❌ Batch ${i + 1} error:`, error instanceof Error ? error.message : 'Unknown');
        }
        failedBatches.push(batch);
        // Increment retry count for failed IDs
        for (const id of batch) {
          retryCountMap[id] = (retryCountMap[id] || 0) + 1;
        }
        console.log(`🔄 Batch ${i + 1} added to retry queue (${batch.length} IDs)`);
      }

      // Delay between batches
      if (i < batchesToProcess - 1) {
        await sleep(settings.delay_between_batches_ms);
      }
    }

    const totalProcessed = processedInChain + processedThisRun;
    const remainingBatches = batches.length - batchesToProcess;
    
    // Combine: remaining retry IDs that weren't processed + newly failed IDs
    const allRetryIds = [...remainingRetryIds, ...failedBatches.flat()];
    const totalFailedIds = allRetryIds.length;

    // Log detailed summary
    console.log(`📊 RUN SUMMARY:`);
    console.log(`   - Properties in queue: ${properties.length}`);
    console.log(`   - Batches attempted: ${batchesToProcess}`);
    console.log(`   - Batches failed/timeout: ${failedBatches.length}`);
    console.log(`   - Processed this run: ${processedThisRun}`);
    console.log(`   - Inactive marked: ${inactiveThisRun}`);
    console.log(`   - Total in chain: ${totalProcessed}`);
    console.log(`   - Remaining batches: ${remainingBatches}`);
    console.log(`   - Retry IDs for next run: ${totalFailedIds}`);
    console.log(`   - Daily limit remaining: ${dailyLimit - totalProcessed}`);

    // Check if we should continue (more batches OR retry IDs, and under daily limit)
    const shouldContinue = (remainingBatches > 0 || allRetryIds.length > 0) && totalProcessed < dailyLimit;
    
    if (shouldContinue) {
      console.log(`🔄 Continuing: ${remainingBatches} remaining + ${allRetryIds.length} retry IDs. Self-triggering...`);
      
      // Fire and forget self-trigger
      fetch(`${supabaseUrl}/functions/v1/trigger-availability-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          processed_count: totalProcessed,
          retry_ids: allRetryIds,
          retry_counts: retryCountMap
        })
      }).catch(err => console.error('Self-trigger error:', err.message));
    }

    console.log(`✅ Run complete: ${processedThisRun} processed this run, ${totalProcessed} total`);

    return new Response(JSON.stringify({
      success: true,
      processed_this_run: processedThisRun,
      total_processed: totalProcessed,
      inactive_this_run: inactiveThisRun,
      failed_batches: failedBatches.length,
      failed_ids_count: totalFailedIds,
      daily_limit: dailyLimit,
      will_continue: shouldContinue
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
