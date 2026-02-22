// Edge Function: check-property-availability-jina v1.2
// Uses Jina AI Reader with Madlan-safe logic (blocked ≠ inactive)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchCategorySettings } from "../_shared/settings.ts";
import { isListingRemoved, isMadlanHomepage } from "../_shared/availability-indicators.ts";
import { classifyMadlanContent, logMadlanScrapeResult } from "../_shared/madlan-observability.ts";

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
 * For Madlan: two-phase approach (cache first, then fresh+proxy if CAPTCHA detected)
 */
async function checkWithJina(
  url: string, 
  source: string, 
  maxRetries: number,
  retryDelayMs: number
): Promise<{ isInactive: boolean; reason: string }> {
  const isMadlan = source === 'madlan';
  
  // Madlan: Phase 1 = cache (fast), Phase 2 = fresh+proxy (bypasses CAPTCHA)
  // Others: single phase with X-No-Cache
  const phases = isMadlan 
    ? [{ noCache: false, label: 'cache' }, { noCache: true, label: 'fresh+proxy' }]
    : [{ noCache: true, label: 'standard' }];
  
  for (const phase of phases) {
    const attempts = isMadlan ? 1 : maxRetries;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const fetchTimeout = isMadlan ? 50000 : 30000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

        const headers: Record<string, string> = {
          'Accept': 'text/markdown',
          'X-Wait-For-Selector': 'body',
          'X-Timeout': '35',
        };
        if (isMadlan) {
          headers['X-Proxy-Country'] = 'IL';
        }
        if (phase.noCache) {
          headers['X-No-Cache'] = 'true';
        }

        console.log(`🌐 Jina ${phase.label} for ${url} (attempt ${attempt})`);

        const response = await fetch(`https://r.jina.ai/${url}`, {
          method: 'GET',
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 429) {
            console.warn(`⚠️ Jina rate limited (429) for ${url}`);
            if (!isMadlan && attempt < maxRetries) {
              await new Promise(r => setTimeout(r, retryDelayMs * attempt));
              continue;
            }
            return { isInactive: false, reason: 'rate_limited' };
          }
          console.warn(`Jina returned ${response.status} for ${url}`);
          if (!isMadlan && attempt < maxRetries) {
            await new Promise(r => setTimeout(r, retryDelayMs * attempt));
            continue;
          }
          break; // try next phase for Madlan
        }

        const markdown = await response.text();

        if (!markdown || markdown.length < 100) {
          console.log(`⚠️ Very short/empty content (${markdown.length} chars) for ${url} — keeping active`);
          return { isInactive: false, reason: 'short_content_keeping_active' };
        }

        // Madlan: use shared classification for structured logging + safe handling
        if (isMadlan) {
          const classification = classifyMadlanContent(markdown, url);
          logMadlanScrapeResult('availability', url, markdown.length, classification);
          
          if (classification !== 'ok') {
            // Blocked/skeleton/captcha/homepage — NEVER mark inactive
            console.log(`🤖 Madlan ${classification} (${markdown.length} chars) for ${url} — retryable, not inactive`);
            return { isInactive: false, reason: `madlan_${classification}` };
          }
        }

        // Check removal indicators (explicit text = the ONLY path to inactive)
        if (isListingRemoved(markdown)) {
          console.log(`🚫 Removal text found for ${url}`);
          return { isInactive: true, reason: 'listing_removed_indicator' };
        }

        // Madlan homepage redirect (fallback — already caught by classifyMadlanContent above)
        if (isMadlan && isMadlanHomepage(markdown)) {
          console.log(`🔄 Madlan homepage redirect for ${url} — treating as retryable`);
          return { isInactive: false, reason: 'madlan_homepage_redirect' };
        }

        console.log(`✅ Content OK for ${url} (${markdown.length} chars, ${phase.label})`);
        return { isInactive: false, reason: 'content_ok' };

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (!isMadlan && attempt < maxRetries) {
          console.log(`⚠️ Attempt ${attempt} failed (${errorMsg}), retrying...`);
          await new Promise(r => setTimeout(r, retryDelayMs * attempt));
          continue;
        }
        console.error(`Jina error for ${url}:`, errorMsg);
        if (isMadlan) break; // try next phase
      }
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
      'madlan_blocked',
      'madlan_captcha',
      'madlan_empty',
      'madlan_retryable',
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
            .select('availability_check_count, last_seen_at, source')
            .eq('id', result.id)
            .single();
          
          // Madlan sightings fallback: use last_seen_at to decide action
          let finalReason = result.reason;
          if (curProp?.source === 'madlan' && curProp?.last_seen_at) {
            const lastSeenAge = Date.now() - new Date(curProp.last_seen_at).getTime();
            const daysSinceLastSeen = lastSeenAge / (1000 * 60 * 60 * 24);
            if (daysSinceLastSeen <= 7) {
              finalReason = `${result.reason}_recently_seen`;
              console.log(`🟢 Madlan ${result.id} blocked but seen ${daysSinceLastSeen.toFixed(1)} days ago — keeping active`);
            } else if (daysSinceLastSeen > 30) {
              finalReason = 'needs_manual_review';
              console.log(`🟡 Madlan ${result.id} blocked and not seen for ${daysSinceLastSeen.toFixed(0)} days — needs manual review`);
            }
          }
          
          await supabase
            .from('scouted_properties')
            .update({ 
              availability_check_reason: finalReason,
              availability_checked_at: new Date().toISOString(),
              availability_check_count: (curProp?.availability_check_count ?? 0) + 1,
            })
            .eq('id', result.id);
          console.log(`🔄 ${result.id} - retryable (${finalReason}), removed from immediate queue`);
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
