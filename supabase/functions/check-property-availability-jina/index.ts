// Edge Function: check-property-availability-jina v1.0
// Copy of check-property-availability with Jina AI Reader instead of Firecrawl
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchCategorySettings } from "../_shared/settings.ts";
import { isListingRemoved, isMadlanHomepage } from "../_shared/availability-indicators.ts";

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
 * Scrape a URL with Jina AI Reader and check for removal indicators
 */
async function checkWithJina(
  url: string, 
  source: string, 
  maxRetries: number,
  retryDelayMs: number
): Promise<{ isInactive: boolean; reason: string }> {
  
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const isMadlan = source === 'madlan';
      const fetchTimeout = isMadlan ? 50000 : 30000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

      const headers: Record<string, string> = {
        'Accept': 'text/markdown',
        'X-Wait-For-Selector': 'body',
        'X-Timeout': isMadlan ? '45' : '30',
        'X-Locale': 'he-IL',
      };

      // Force fresh scrape only for non-Madlan (Madlan benefits from cache to avoid bot detection)
      if (!isMadlan) {
        headers['X-No-Cache'] = 'true';
      }




      const response = await fetch(`https://r.jina.ai/${url}`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`⚠️ Jina rate limited (429) for ${url}, attempt ${attempt}/${maxRetries}`);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, retryDelayMs * attempt));
            continue;
          }
          return { isInactive: false, reason: 'rate_limited' };
        }
        console.warn(`Jina returned ${response.status} for ${url}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, retryDelayMs * attempt));
          continue;
        }
        return { isInactive: false, reason: 'jina_failed_after_retries' };
      }

      const markdown = await response.text();

      if (!markdown || markdown.length < 100) {
        console.log(`⚠️ Very short/empty content (${markdown.length} chars) for ${url} — keeping active`);
        return { isInactive: false, reason: 'short_content_keeping_active' };
      }

      // Madlan skeleton detection: if content is suspiciously short, mark as retryable
      if (source === 'madlan' && markdown.length < 1000) {
        console.log(`⚠️ Madlan skeleton detected (${markdown.length} chars) for ${url}`);
        return { isInactive: false, reason: 'madlan_skeleton' };
      }

      // Check 1: Madlan CAPTCHA/bot block detection (before removal checks)
      if (source === 'madlan' && markdown.includes('סליחה על ההפרעה')) {
        console.log(`🤖 Madlan CAPTCHA block detected for ${url} — retryable`);
        return { isInactive: false, reason: 'madlan_captcha_blocked' };
      }

      // Check 2: does the page contain a specific removal string?
      if (isListingRemoved(markdown)) {
        console.log(`🚫 Removal text found for ${url}`);
        return { isInactive: true, reason: 'listing_removed_indicator' };
      }

      // Check 3: Madlan homepage redirect — treated as retryable in Jina (can't distinguish bot block from real removal)
      if (source === 'madlan' && isMadlanHomepage(markdown)) {
        console.log(`🔄 Madlan homepage redirect for ${url} — treating as retryable (possible bot block)`);
        return { isInactive: false, reason: 'madlan_homepage_redirect' };
      }

      return { isInactive: false, reason: 'content_ok' };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (attempt < maxRetries) {
        console.log(`⚠️ Attempt ${attempt} failed (${errorMsg}), retrying...`);
        await new Promise(r => setTimeout(r, retryDelayMs * attempt));
        continue;
      }
      console.error(`Jina error for ${url}:`, errorMsg);
    }
  }
  
  return { isInactive: false, reason: 'jina_failed_after_retries' };
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

async function processPropertiesInParallel(
  properties: PropertyToCheck[],
  concurrencyLimit: number,
  settings: any,
  abortSignal: AbortSignal
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const perPropertyTimeout = settings.per_property_timeout_ms || 15000;
  
  const delayBetweenRequests = 3000; // 3s between requests to respect Jina free tier (20 req/min)
  
  for (let i = 0; i < properties.length; i++) {
    if (abortSignal.aborted) {
      console.log(`⏱️ Global timeout reached, stopping after ${results.length} results`);
      break;
    }
    
    if (i > 0 && i % concurrencyLimit === 0) {
      console.log(`🔄 Processing chunk ${Math.floor(i / concurrencyLimit) + 1}`);
    } else if (i === 0) {
      console.log(`🔄 Processing chunk 1`);
    }
    
    try {
      const result = await checkSingleProperty(properties[i], settings, perPropertyTimeout);
      results.push(result);
    } catch (err) {
      console.error(`Error checking property ${properties[i].id}:`, err);
    }
    
    // Wait between requests to stay within Jina free tier rate limit
    if (i < properties.length - 1) {
      await new Promise(r => setTimeout(r, delayBetweenRequests));
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
      globalAbortController.signal
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
      'madlan_skeleton',
      'madlan_captcha_blocked',
      'madlan_homepage_redirect',
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
