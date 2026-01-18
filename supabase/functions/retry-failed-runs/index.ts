import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetryStrategy {
  delayMinutes: number;
  reducePages?: boolean;
  rotateUserAgent?: boolean;
  increaseWaitFor?: boolean;
}

// Determine retry strategy based on error type
function getRetryStrategy(errorMessage: string | null): RetryStrategy | null {
  if (!errorMessage) return null;
  
  const lowerError = errorMessage.toLowerCase();
  
  // Code bugs - don't retry
  if (lowerError.includes('is not defined') || 
      lowerError.includes('is not a function') ||
      lowerError.includes('config not found') ||
      lowerError.includes('api key not configured')) {
    return null;
  }
  
  // Timeout errors - wait longer, use fewer pages
  if (lowerError.includes('timeout') || lowerError.includes('took longer than')) {
    return { delayMinutes: 30, reducePages: true };
  }
  
  // Blocked/CAPTCHA - wait much longer, rotate user agent
  if (lowerError.includes('blocked') || 
      lowerError.includes('captcha') ||
      lowerError.includes('rate limit') ||
      lowerError.includes('too many requests')) {
    return { delayMinutes: 60, rotateUserAgent: true };
  }
  
  // Empty content - try again with longer wait
  if (lowerError.includes('content too short') || 
      lowerError.includes('no property indicators')) {
    return { delayMinutes: 10, increaseWaitFor: true };
  }
  
  // Default - retry after 15 minutes
  return { delayMinutes: 15 };
}

// List of retryable error patterns
const RETRYABLE_ERRORS = [
  'timeout',
  'blocked',
  'captcha',
  'content too short',
  'rate limit',
  'no property indicators',
  'took longer than',
  'empty page',
  'aborted'
];

function isRetryableError(errorMessage: string | null): boolean {
  if (!errorMessage) return false;
  const lowerError = errorMessage.toLowerCase();
  return RETRYABLE_ERRORS.some(pattern => lowerError.includes(pattern));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔄 Retry Failed Runs - Starting check...');

  try {
    // Find failed/partial runs from the last 3 hours that can be retried
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data: failedRuns, error: fetchError } = await supabase
      .from('scout_runs')
      .select('id, config_id, source, error_message, retry_count, max_retries, started_at')
      .in('status', ['failed', 'partial'])
      .gte('started_at', threeHoursAgo)
      .is('retry_of', null) // Only original runs, not retries
      .order('started_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${failedRuns?.length || 0} failed/partial runs in last 3 hours`);

    if (!failedRuns || failedRuns.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No runs to retry',
        checked: 0,
        retried: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const retriedRuns: string[] = [];
    const skippedRuns: { id: string; reason: string }[] = [];
    const now = Date.now();

    for (const run of failedRuns) {
      // Check if already at max retries
      const maxRetries = run.max_retries ?? 2;
      if ((run.retry_count || 0) >= maxRetries) {
        skippedRuns.push({ id: run.id, reason: `Max retries reached (${run.retry_count}/${maxRetries})` });
        continue;
      }

      // Check if error is retryable
      if (!isRetryableError(run.error_message)) {
        skippedRuns.push({ id: run.id, reason: `Non-retryable error: ${run.error_message?.substring(0, 50)}` });
        continue;
      }

      // Get retry strategy
      const strategy = getRetryStrategy(run.error_message);
      if (!strategy) {
        skippedRuns.push({ id: run.id, reason: 'No retry strategy for this error type' });
        continue;
      }

      // Check if enough time has passed based on strategy
      const runTime = new Date(run.started_at).getTime();
      const minWaitMs = strategy.delayMinutes * 60 * 1000;
      const timeSinceRun = now - runTime;
      
      if (timeSinceRun < minWaitMs) {
        const waitRemaining = Math.round((minWaitMs - timeSinceRun) / 60000);
        skippedRuns.push({ id: run.id, reason: `Need to wait ${waitRemaining} more minutes` });
        continue;
      }

      console.log(`Retrying run ${run.id} (${run.source}) - attempt ${(run.retry_count || 0) + 1}/${maxRetries}`);

      // Update retry count on original run
      await supabase
        .from('scout_runs')
        .update({ retry_count: (run.retry_count || 0) + 1 })
        .eq('id', run.id);

      // Trigger new scout-properties run with retry_of reference
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/scout-properties`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            config_id: run.config_id,
            retry_of: run.id,
            retry_strategy: strategy // Pass strategy to scout-properties
          })
        });

        if (response.ok) {
          retriedRuns.push(run.id);
          console.log(`✅ Successfully triggered retry for run ${run.id}`);
        } else {
          const errorText = await response.text();
          console.error(`Failed to trigger retry for run ${run.id}: ${errorText}`);
          skippedRuns.push({ id: run.id, reason: `Trigger failed: ${errorText.substring(0, 100)}` });
        }
      } catch (triggerError) {
        console.error(`Error triggering retry for run ${run.id}:`, triggerError);
        skippedRuns.push({ id: run.id, reason: `Trigger error: ${triggerError}` });
      }

      // Wait 5 seconds between retries to avoid overwhelming the system
      await new Promise(r => setTimeout(r, 5000));
    }

    console.log(`🔄 Retry complete: ${retriedRuns.length} retried, ${skippedRuns.length} skipped`);

    return new Response(JSON.stringify({
      success: true,
      checked: failedRuns.length,
      retried: retriedRuns.length,
      skipped: skippedRuns.length,
      retriedRuns,
      skippedDetails: skippedRuns
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in retry-failed-runs:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
