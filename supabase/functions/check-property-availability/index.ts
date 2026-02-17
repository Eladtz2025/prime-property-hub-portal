// Edge Function: check-property-availability v4.0
// Simplified: Firecrawl-only, text-based detection with exact removal strings
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchCategorySettings } from "../_shared/settings.ts";
import { isListingRemoved } from "../_shared/availability-indicators.ts";
import { getActiveFirecrawlKey, markKeyExhausted, isRateLimitError } from "../_shared/firecrawl-keys.ts";

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
 * Scrape a URL with Firecrawl and check for removal indicators
 */
async function checkWithFirecrawl(
  url: string, 
  source: string, 
  firecrawlApiKey: string,
  maxRetries: number,
  retryDelayMs: number
): Promise<{ isInactive: boolean; reason: string; rateLimited?: boolean }> {
  const waitForMs = source === 'yad2' ? 5000 : 3000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: false,
          waitFor: waitForMs,
          proxy: source === 'yad2' ? 'stealth' : 'auto',
          location: { country: 'IL', languages: ['he'] }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Signal rate limit so caller can rotate keys
        if (isRateLimitError(response.status)) {
          console.warn(`🔑 Rate limited (${response.status}) for ${url}`);
          return { isInactive: false, reason: 'rate_limited', rateLimited: true };
        }
        console.warn(`Firecrawl returned ${response.status} for ${url}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, retryDelayMs * attempt));
          continue;
        }
        return { isInactive: false, reason: 'firecrawl_failed_after_retries' };
      }

      const result = await response.json();
      const markdown = result?.data?.markdown || result?.markdown || '';

      if (!markdown || markdown.length < 100) {
        console.log(`⚠️ Very short/empty content (${markdown.length} chars) for ${url} — keeping active`);
        return { isInactive: false, reason: 'short_content_keeping_active' };
      }

      // The ONLY check: does the page contain a specific removal string?
      if (isListingRemoved(markdown)) {
        console.log(`🚫 Removal text found for ${url}`);
        return { isInactive: true, reason: 'listing_removed_indicator' };
      }

      return { isInactive: false, reason: 'content_ok' };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (attempt < maxRetries) {
        console.log(`⚠️ Attempt ${attempt} failed (${errorMsg}), retrying...`);
        await new Promise(r => setTimeout(r, retryDelayMs * attempt));
        continue;
      }
      console.error(`Firecrawl error for ${url}:`, errorMsg);
    }
  }
  
  return { isInactive: false, reason: 'firecrawl_failed_after_retries' };
}

async function checkSingleProperty(
  property: PropertyToCheck,
  firecrawlApiKey: string,
  settings: any,
  timeoutMs: number
): Promise<CheckResult & { rateLimited?: boolean }> {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('PROPERTY_TIMEOUT')), timeoutMs)
  );
  
  const checkPromise = checkWithFirecrawl(
    property.source_url,
    property.source,
    firecrawlApiKey,
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

async function processPropertiesInParallel(
  properties: PropertyToCheck[],
  concurrencyLimit: number,
  initialFirecrawlKey: { key: string; id: string | null },
  settings: any,
  abortSignal: AbortSignal,
  supabase: any
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const perPropertyTimeout = settings.per_property_timeout_ms || 15000;
  let currentKey = initialFirecrawlKey;
  
  for (let i = 0; i < properties.length; i += concurrencyLimit) {
    if (abortSignal.aborted) {
      console.log(`⏱️ Global timeout reached, stopping after ${results.length} results`);
      break;
    }
    
    const chunk = properties.slice(i, i + concurrencyLimit);
    console.log(`🔄 Processing chunk ${Math.floor(i / concurrencyLimit) + 1}`);
    
    const chunkResults = await Promise.allSettled(
      chunk.map(prop => checkSingleProperty(prop, currentKey.key, settings, perPropertyTimeout))
    );
    
    // Check if any result was rate limited
    let needsKeyRotation = false;
    for (const result of chunkResults) {
      if (result.status === 'fulfilled' && result.value.rateLimited) {
        needsKeyRotation = true;
        break;
      }
    }
    
    if (needsKeyRotation) {
      // If the current key is the env var fallback (id=null),
      // we can't rotate further — stop immediately
      if (currentKey.id === null) {
        console.error('❌ All Firecrawl keys exhausted (including env fallback), stopping');
        for (const prop of properties.slice(i)) {
          results.push({ id: prop.id, isInactive: false, reason: 'all_keys_exhausted', error: true });
        }
        break;
      }

      console.log(`🔑 Rate limited on DB key "${currentKey.id}", rotating...`);
      await markKeyExhausted(supabase, currentKey.id);
      
      try {
        currentKey = await getActiveFirecrawlKey(supabase);
        console.log(`🔑 Rotated to new key (id=${currentKey.id}), retrying chunk...`);
        
        // Retry the entire chunk with the new key
        const retryResults = await Promise.allSettled(
          chunk.map(prop => checkSingleProperty(prop, currentKey.key, settings, perPropertyTimeout))
        );
        
        for (const result of retryResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          }
        }
        continue;
      } catch {
        console.error('❌ No more Firecrawl keys available, stopping');
        for (const prop of properties.slice(i)) {
          results.push({ id: prop.id, isInactive: false, reason: 'all_keys_exhausted', error: true });
        }
        break;
      }
    }
    
    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
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

  // Get Firecrawl API key with rotation support
  let firecrawlKey: { key: string; id: string | null };
  try {
    firecrawlKey = await getActiveFirecrawlKey(supabase);
  } catch {
    clearTimeout(globalTimeoutId);
    return new Response(JSON.stringify({
      success: false,
      error: 'No Firecrawl API key available'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  

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

    console.log(`🔍 Checking ${properties.length} properties (Firecrawl-only, text-based detection)`);

    const concurrencyLimit = settings.concurrency_limit || 3;
    const results = await processPropertiesInParallel(
      properties,
      concurrencyLimit,
      firecrawlKey,
      settings,
      globalAbortController.signal,
      supabase
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
      'firecrawl_failed_after_retries', 
      'check_error',
      'short_content_keeping_active',
      'all_keys_exhausted',
      'rate_limited'
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
