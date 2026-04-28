// Edge Function: check-property-availability-jina v3.0
// Madlan uses Direct Fetch (no Jina), Yad2/Homeless use Jina
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchCategorySettings } from "../_shared/settings.ts";
import {
  isListingRemoved,
  isMadlanBlocked,
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
 * Direct Fetch for Madlan - bypasses Jina entirely.
 * Same approach as scout-madlan: omit User-Agent to avoid bot detection.
 */
async function checkMadlanDirect(
  url: string
): Promise<{ isInactive: boolean; reason: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    console.log(`🟠 Madlan-Direct availability check for ${url}`);

    // CRITICAL: Madlan WAF (April 2026+) blocks browser-like UA/Referer AND
    // X-Nextjs-Data headers with 403 Captcha. Only minimal headers pass through.
    // Same strategy as scout-madlan-direct.
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // 404/410 = listing removed
    if (response.status === 404 || response.status === 410) {
      console.log(`🚫 Madlan ${response.status} for ${url}`);
      // Consume body to avoid resource leak
      await response.text();
      return { isInactive: true, reason: `listing_removed_${response.status}` };
    }

    if (!response.ok) {
      console.warn(`⚠️ Madlan-Direct returned ${response.status} for ${url}`);
      await response.text();
      return { isInactive: false, reason: `madlan_direct_status_${response.status}` };
    }

    const html = await response.text();

    if (!html || html.length < 200) {
      console.log(`⚠️ Madlan-Direct short content (${html.length} chars) for ${url}`);
      return { isInactive: false, reason: 'short_content_keeping_active' };
    }

    // Strategy 1: Check <title> for removal indicator (SSR-rendered, reliable)
    const title = html.match(/<title>(.*?)<\/title>/)?.[1] || '';
    if (title.includes('המודעה הוסרה')) {
      console.log(`🚫 Madlan-Direct title indicates removal for ${url}: "${title}"`);
      return { isInactive: true, reason: 'listing_removed_title' };
    }

    // Strategy 2: Check og:description for removal text (SSR-rendered, reliable)
    const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/)?.[1] || '';
    if (ogDesc.includes('המודעה המבוקשת כבר אינה מפורסמת') || ogDesc.includes('המודעה הוסרה')) {
      console.log(`🚫 Madlan-Direct og:description indicates removal for ${url}`);
      return { isInactive: true, reason: 'listing_removed_og_description' };
    }

    // Strategy 3: Check og:title for removal text
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/)?.[1] || '';
    if (ogTitle.includes('המודעה הוסרה')) {
      console.log(`🚫 Madlan-Direct og:title indicates removal for ${url}`);
      return { isInactive: true, reason: 'listing_removed_og_title' };
    }

    // Strategy 4: Check for removal indicators in body text (fallback)
    if (isListingRemoved(html)) {
      console.log(`🚫 Madlan-Direct removal text found in body for ${url}`);
      return { isInactive: true, reason: 'listing_removed_indicator' };
    }

    // Check for CAPTCHA/block page - treat as retryable, not removal
    if (isMadlanBlocked(html)) {
      console.log(`⚠️ Madlan-Direct CAPTCHA/block detected for ${url}`);
      return { isInactive: false, reason: 'madlan_blocked_retry' };
    }

    // Strategy 5: Content size heuristic — removed listings return ~90KB shell,
    // active listings return ~1.5MB+ with full SSR content
    if (html.length < 200000) {
      // Double-check with og:url — removed listings have og:url pointing to homepage
      const ogUrl = html.match(/<meta[^>]*property="og:url"[^>]*content="([^"]*)"[^>]*>/)?.[1] || '';
      const isOgHomepage = ogUrl === 'https://www.madlan.co.il' || ogUrl === 'https://www.madlan.co.il/';
      
      if (isOgHomepage) {
        console.log(`🚫 Madlan-Direct removed: small HTML (${html.length} chars) + og:url is homepage for ${url}`);
        return { isInactive: true, reason: 'listing_removed_small_html_og_homepage' };
      }
      
      console.log(`⚠️ Madlan-Direct small HTML (${html.length} chars) but og:url=${ogUrl} — keeping active for ${url}`);
    }

    console.log(`✅ Madlan-Direct OK for ${url} (${html.length} chars)`);
    return { isInactive: false, reason: 'content_ok' };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    console.warn(`⚠️ Madlan-Direct ${isTimeout ? 'timeout' : 'error'} for ${url}: ${errorMsg}`);
    return { isInactive: false, reason: isTimeout ? 'per_property_timeout' : 'check_error' };
  }
}

/**
 * Scrape a URL with Jina AI Reader and check for removal indicators.
 * Used for Yad2 and Homeless sources.
 */
async function checkWithJina(
  url: string, 
  source: string, 
  _maxRetries: number,
  _retryDelayMs: number
): Promise<{ isInactive: boolean; reason: string }> {
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
  
  // Route Madlan through Direct Fetch, others through Jina
  const checkPromise = property.source === 'madlan'
    ? checkMadlanDirect(property.source_url).then(result => ({ id: property.id, ...result }))
    : checkWithJina(
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
  const perPropertyTimeout = settings.per_property_timeout_ms || 25000;

  // Split properties: Madlan uses Direct Fetch (no rate limit), Yad2/Homeless use Jina (20 RPM limit)
  const madlanProps = properties.filter(p => p.source === 'madlan');
  const jinaProps = properties.filter(p => p.source !== 'madlan');

  console.log(`📊 Split: ${madlanProps.length} Madlan (parallel), ${jinaProps.length} Jina (sequential 3.5s delay)`);

  // --- Madlan: parallel batches (same as before, no rate limit) ---
  async function processMadlanParallel(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const parallelism = Math.min(concurrencyLimit, 5);
    const delayBetweenBatches = 1500;

    for (let i = 0; i < madlanProps.length; i += parallelism) {
      if (abortSignal.aborted) break;
      if (await isRunStopped(supabase, runId)) {
        console.log(`🛑 Run stopped, halting Madlan batch after ${results.length}`);
        break;
      }

      const batch = madlanProps.slice(i, i + parallelism);
      console.log(`🔄 Madlan batch ${Math.floor(i / parallelism) + 1}: ${batch.length} properties`);

      const batchResults = await Promise.allSettled(
        batch.map(prop => checkSingleProperty(prop, settings, perPropertyTimeout))
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Error checking Madlan property ${batch[j].id}:`, result.reason);
          results.push({ id: batch[j].id, isInactive: false, reason: 'check_error', error: true });
        }
      }

      if (i + parallelism < madlanProps.length && !abortSignal.aborted) {
        await new Promise(r => setTimeout(r, delayBetweenBatches));
      }
    }
    return results;
  }

  // --- Jina (Yad2/Homeless): sequential with 3.5s delay to stay under 20 RPM ---
  async function processJinaSequential(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const JINA_DELAY_MS = 3500; // ~17 RPM, safely under 20 RPM limit

    for (let i = 0; i < jinaProps.length; i++) {
      if (abortSignal.aborted) break;
      if (await isRunStopped(supabase, runId)) {
        console.log(`🛑 Run stopped, halting Jina sequential after ${results.length}`);
        break;
      }

      const prop = jinaProps[i];
      console.log(`🔄 Jina sequential ${i + 1}/${jinaProps.length}: ${prop.source} - ${prop.id}`);

      try {
        const result = await checkSingleProperty(prop, settings, perPropertyTimeout);
        results.push(result);
      } catch (err) {
        console.error(`Error checking Jina property ${prop.id}:`, err);
        results.push({ id: prop.id, isInactive: false, reason: 'check_error', error: true });
      }

      // Delay before next Jina request (skip after last one)
      if (i < jinaProps.length - 1 && !abortSignal.aborted) {
        await new Promise(r => setTimeout(r, JINA_DELAY_MS));
      }
    }
    return results;
  }

  // Run both in parallel — Madlan batches + Jina sequential don't compete
  const [madlanResults, jinaResults] = await Promise.all([
    processMadlanParallel(),
    processJinaSequential(),
  ]);

  const allResults = [...madlanResults, ...jinaResults];
  console.log(`✅ Combined results: ${madlanResults.length} Madlan + ${jinaResults.length} Jina = ${allResults.length} total`);
  return allResults;
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

    // Also treat any non-OK madlan_direct_status_* as retryable
    const isRetryableReason = (reason: string, hasError: boolean): boolean => {
      if (hasError) return true;
      if (retryableReasons.has(reason)) return true;
      if (reason.startsWith('madlan_direct_status_') && reason !== 'madlan_direct_status_200') return true;
      if (reason.startsWith('jina_status_')) return true;
      return false;
    };

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
      
      const retryable = isRetryableReason(result.reason, !!result.error);
      
      if (retryable) {
        errorCount++;
        try {
          // For 403 blocks: also update availability_checked_at to send to end of queue
          // so it won't be re-checked immediately in the same run
          const updateData: Record<string, any> = {
            availability_check_reason: result.reason,
          };
          if (result.reason === 'madlan_direct_status_403') {
            updateData.availability_checked_at = new Date().toISOString();
            console.log(`🔄 ${result.id} - 403 blocked, sent to end of queue`);
          } else {
            console.log(`🔄 ${result.id} - retryable (${result.reason}), stays in queue for next run`);
          }
          // No retry count increment — property stays in queue indefinitely until resolved
          await supabase
            .from('scouted_properties')
            .update(updateData)
            .eq('id', result.id);
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
          availability_retry_count: 0, // Reset on successful check
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
