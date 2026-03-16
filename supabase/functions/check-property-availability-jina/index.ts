// Edge Function: check-property-availability-jina v3.0
// Madlan uses Direct Fetch (no Jina), Yad2/Homeless use Jina
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchCategorySettings } from "../_shared/settings.ts";
import {
  isListingRemoved,
  isMadlanBlocked,
  isMadlanHomepage,
  isMadlanSearchResultsPage,
} from "../_shared/availability-indicators.ts";

const GLOBAL_TIMEOUT_MS = 55000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyToCheck {
  id: string;
  source_url: string;
  source: string;
  title: string;
}

interface CheckResult {
  id: string;
  isInactive: boolean;
  reason: string;
  error?: boolean;
}

/**
 * Scrape a URL with Jina AI Reader and check for removal indicators.
 * Same logic for all sources: single request with X-No-Cache.
 */
async function checkWithJina(
  url: string, 
  source: string, 
  _maxRetries: number,
  _retryDelayMs: number
): Promise<{ isInactive: boolean; reason: string }> {
  // Single attempt - no retries. The queue system handles retries naturally.
  // Retries multiply requests and trigger Jina rate limits.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const headers: Record<string, string> = {
      'Accept': 'text/markdown',
      'X-Wait-For-Selector': 'body',
      'X-Timeout': '20',
      'X-Locale': 'he-IL',
      'X-No-Cache': 'true',
    };

    if (source === 'madlan') {
      headers['X-Proxy-Country'] = 'IL';
    }

    const response = await fetch(`https://r.jina.ai/${url}`, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`⚠️ Jina rate limited (429) for ${url}`);
        return { isInactive: false, reason: 'rate_limited' };
      }
      console.warn(`⚠️ Jina returned ${response.status} for ${url}`);
      return { isInactive: false, reason: `jina_status_${response.status}` };
    }

    const markdown = await response.text();

    if (!markdown || markdown.length < 100) {
      console.log(`⚠️ Short content (${markdown.length} chars) for ${url}`);
      return { isInactive: false, reason: 'short_content_keeping_active' };
    }

    if (isListingRemoved(markdown)) {
      console.log(`🚫 Removal text found for ${url}`);
      return { isInactive: true, reason: 'listing_removed_indicator' };
    }

    const isMadlanListingUrl = source === 'madlan' && url.includes('/listings/');

    if (source === 'madlan' && isMadlanBlocked(markdown)) {
      console.warn(`⚠️ Madlan blocked/captcha for ${url} (${markdown.length} chars)`);
      return { isInactive: false, reason: 'madlan_blocked_retry' };
    }

    if (isMadlanListingUrl && isMadlanHomepage(markdown)) {
      console.log(`🚫 Madlan homepage redirect for ${url} (${markdown.length} chars)`);
      return { isInactive: true, reason: 'listing_removed_homepage_redirect' };
    }

    if (isMadlanListingUrl && isMadlanSearchResultsPage(markdown)) {
      console.log(`🚫 Madlan search-results redirect for ${url} (${markdown.length} chars)`);
      return { isInactive: true, reason: 'listing_removed_search_results_redirect' };
    }

    console.log(`✅ OK for ${url} (${markdown.length} chars)`);
    return { isInactive: false, reason: 'content_ok' };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    console.warn(`⚠️ Jina ${isTimeout ? 'timeout' : 'error'} for ${url}: ${errorMsg}`);
    return { isInactive: false, reason: isTimeout ? 'per_property_timeout' : 'check_error' };
  }
}

async function checkSingleProperty(
  property: PropertyToCheck,
  settings: any,
  timeoutMs: number
): Promise<CheckResult> {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('PROPERTY_TIMEOUT')), timeoutMs)
  );
  
  const checkPromise = checkWithJina(
    property.source_url,
    property.source,
    settings.firecrawl_max_retries,
    settings.firecrawl_retry_delay_ms
  ).then(result => ({ id: property.id, ...result }));
  
  try {
    return await Promise.race([checkPromise, timeoutPromise]);
  } catch (error) {
    const reason = error instanceof Error && error.message === 'PROPERTY_TIMEOUT' 
      ? 'per_property_timeout' 
      : 'check_error';
    return { id: property.id, isInactive: false, reason, error: true };
  }
}

async function isRunStopped(supabase: any, runId: string | null): Promise<boolean> {
  if (!runId) return false;
  try {
    const { data } = await supabase
      .from('availability_check_runs')
      .select('status')
      .eq('id', runId)
      .single();
    return data?.status === 'stopped';
  } catch {
    return false;
  }
}

async function processPropertiesInParallel(
  properties: PropertyToCheck[],
  concurrencyLimit: number,
  settings: any,
  abortSignal: AbortSignal,
  supabase: any,
  runId: string | null
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const perPropertyTimeout = settings.per_property_timeout_ms || 25000;
  
  // Process in parallel batches of concurrencyLimit (default 3)
  const parallelism = Math.min(concurrencyLimit, 5); // Cap at 5 concurrent
  const delayBetweenBatches = 1500; // 1.5s between parallel batches
  
  for (let i = 0; i < properties.length; i += parallelism) {
    if (abortSignal.aborted) {
      console.log(`⏱️ Global timeout reached, stopping after ${results.length} results`);
      break;
    }

    // Check if run was stopped before each mini-batch
    if (await isRunStopped(supabase, runId)) {
      console.log(`🛑 Run ${runId} stopped by user, halting after ${results.length} properties`);
      break;
    }
    
    const batch = properties.slice(i, i + parallelism);
    console.log(`🔄 Parallel batch ${Math.floor(i / parallelism) + 1}: ${batch.length} properties simultaneously`);
    
    // Process batch in parallel with Promise.allSettled for resilience
    const batchResults = await Promise.allSettled(
      batch.map(prop => checkSingleProperty(prop, settings, perPropertyTimeout))
    );
    
    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Error checking property ${batch[j].id}:`, result.reason);
        results.push({ id: batch[j].id, isInactive: false, reason: 'check_error', error: true });
      }
    }
    
    // Brief delay between parallel batches
    if (i + parallelism < properties.length && !abortSignal.aborted) {
      await new Promise(r => setTimeout(r, delayBetweenBatches));
    }
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const globalAbortController = new AbortController();
  const globalTimeoutId = setTimeout(() => {
    console.log(`⏱️ Global timeout (${GLOBAL_TIMEOUT_MS}ms) reached`);
    globalAbortController.abort();
  }, GLOBAL_TIMEOUT_MS);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const settings = await fetchCategorySettings(supabase, 'availability');

  try {
    let propertyIds: string[] = [];
    let runId: string | null = null;
    
    try {
      const body = await req.json();
      if (body.property_ids && Array.isArray(body.property_ids)) {
        propertyIds = body.property_ids;
        console.log(`📋 Received ${propertyIds.length} property IDs`);
      }
      if (body.run_id) {
        runId = body.run_id;
      }
    } catch {
      // No body
    }

    if (propertyIds.length === 0) {
      clearTimeout(globalTimeoutId);
      return new Response(JSON.stringify({
        success: true, message: 'No property IDs provided', checked: 0, marked_inactive: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: properties, error } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, title, address, neighborhood')
      .in('id', propertyIds);

    if (error) throw error;

    if (!properties || properties.length === 0) {
      clearTimeout(globalTimeoutId);
      return new Response(JSON.stringify({
        success: true, message: 'No properties found', checked: 0, marked_inactive: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`🔍 Checking ${properties.length} properties (Jina AI Reader, text-based detection)`);

    const concurrencyLimit = settings.concurrency_limit || 3;
    const results = await processPropertiesInParallel(
      properties,
      concurrencyLimit,
      settings,
      globalAbortController.signal,
      supabase,
      runId
    );

    clearTimeout(globalTimeoutId);

    let checkedCount = 0;
    let inactiveCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const inactiveIds: string[] = [];
    const detailedResults: any[] = [];

    const retryableReasons = new Set([
      'per_property_timeout',
      'jina_failed_after_retries',
      'check_error',
      'short_content_keeping_active',
      'rate_limited',
      'madlan_blocked_retry',
    ]);

    for (const result of results) {
      checkedCount++;
      
      const prop = properties.find(p => p.id === result.id);
      const detail = {
        property_id: result.id,
        source_url: prop?.source_url || null,
        source: prop?.source || null,
        address: prop?.address || prop?.title || null,
        neighborhood: prop?.neighborhood || null,
        reason: result.reason,
        is_inactive: result.isInactive,
        checked_at: new Date().toISOString(),
      };
      detailedResults.push(detail);
      
      if (runId) {
        try {
          await supabase.rpc('append_run_detail', {
            p_run_id: runId,
            p_detail: detail,
          });
        } catch (rpcErr) {
          console.warn(`Failed to append run detail:`, rpcErr);
        }
      }
      
      const isRetryable = result.error || retryableReasons.has(result.reason);
      
      if (isRetryable) {
        errorCount++;
        try {
          const { data: curProp } = await supabase
            .from('scouted_properties')
            .select('availability_check_count')
            .eq('id', result.id)
            .single();
          
          await supabase
            .from('scouted_properties')
            .update({ 
              availability_check_reason: result.reason,
              availability_checked_at: new Date().toISOString(),
              availability_check_count: (curProp?.availability_check_count ?? 0) + 1,
            })
            .eq('id', result.id);
          console.log(`🔄 ${result.id} - retryable (${result.reason}), removed from immediate queue`);
        } catch (dbError) {
          console.error(`DB update error for ${result.id}:`, dbError);
        }
        continue;
      }
      
      if (result.isInactive) {
        inactiveCount++;
        inactiveIds.push(result.id);
        console.log(`❌ ${result.id} - INACTIVE (${result.reason})`);
      }
      
      try {
        const { data: currentProp } = await supabase
          .from('scouted_properties')
          .select('availability_check_count')
          .eq('id', result.id)
          .single();
        
        const currentCount = currentProp?.availability_check_count ?? 0;
        
        const updateData: Record<string, any> = {
          availability_checked_at: new Date().toISOString(),
          availability_check_reason: result.reason,
          availability_check_count: currentCount + 1,
        };
        
        if (result.isInactive) {
          updateData.is_active = false;
          updateData.status = 'inactive';
          
          await supabase
            .from('scouted_properties')
            .update(updateData)
            .eq('id', result.id);
        } else {
          const { data: updateResult } = await supabase
            .from('scouted_properties')
            .update(updateData)
            .eq('id', result.id)
            .eq('is_active', true)
            .select('id');
          
          if (!updateResult || updateResult.length === 0) {
            skippedCount++;
            console.log(`⏭️ ${result.id} - Skipped (already inactive)`);
          }
        }
      } catch (dbError) {
        console.error(`DB update error for ${result.id}:`, dbError);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`✅ Done in ${elapsed}ms: ${checkedCount} checked, ${inactiveCount} inactive, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      checked: checkedCount,
      marked_inactive: inactiveCount,
      errors: errorCount,
      inactive_ids: inactiveIds,
      results: detailedResults,
      elapsed_ms: elapsed,
      global_timeout_hit: globalAbortController.signal.aborted
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    clearTimeout(globalTimeoutId);
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
