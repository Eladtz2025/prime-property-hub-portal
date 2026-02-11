// Edge Function: check-property-availability v3.0
// Changes: Global timeout, HEAD-first before Firecrawl
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchCategorySettings } from "../_shared/settings.ts";
import { 
  isListingRemoved, 
  isRedirectDetected, 
  hasPropertyIndicators 
} from "../_shared/availability-indicators.ts";

const GLOBAL_TIMEOUT_MS = 50000; // 50 seconds - safely under Edge Function limit

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
 * Quick HEAD check before Firecrawl - catches 404/410/redirects fast
 */
async function quickHeadCheck(
  url: string,
  source: string,
  timeoutMs: number = 3000
): Promise<{ isInactive: boolean; reason: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'manual'
    });

    clearTimeout(timeoutId);

    if (response.status === 404 || response.status === 410) {
      console.log(`⚡ HEAD ${response.status} for ${url}`);
      return { isInactive: true, reason: `head_http_${response.status}` };
    }

    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location') || '';
      // For yad2: redirect away from /item/ means removed
      if (source === 'yad2' && !location.includes('/item/')) {
        return { isInactive: true, reason: 'head_redirect_away' };
      }
      // Generic: redirect to homepage
      const isRedirectToHome = location.endsWith('/') || 
        (!location.includes('?') && !location.includes('/viewad') && !location.includes('/item'));
      if (isRedirectToHome) {
        return { isInactive: true, reason: 'head_redirect_to_home' };
      }
    }

    // HEAD didn't determine status - need Firecrawl
    return null;
  } catch {
    // HEAD failed (timeout, network error) - proceed to Firecrawl
    return null;
  }
}

/**
 * Scrape for availability check with onlyMainContent: false
 */
async function scrapeForAvailabilityCheck(
  url: string, 
  firecrawlApiKey: string, 
  source: string,
  timeoutMs: number = 20000
): Promise<any> {
  const waitForMs = source === 'yad2' ? 5000 : 3000;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor: waitForMs,
        proxy: source === 'yad2' ? 'stealth' : 'auto',
        location: { country: 'IL', languages: ['he'] }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (response.ok) {
      return await response.json();
    }
    console.warn(`Firecrawl returned ${response.status} for ${url}`);
    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`Firecrawl timeout (${timeoutMs}ms) for ${url}`);
    } else {
      console.warn(`Firecrawl error for ${url}:`, error);
    }
    return null;
  }
}

/**
 * Check via Firecrawl with PROPERTY-INDICATORS-FIRST approach
 * Changed from indicator-first to prevent false positives from temporary error pages
 */
async function checkWithFirecrawl(
  url: string, 
  source: string, 
  firecrawlApiKey: string,
  maxRetries: number,
  retryDelayMs: number
): Promise<{ isInactive: boolean; reason: string }> {
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await scrapeForAvailabilityCheck(url, firecrawlApiKey, source);
      
      if (result) {
        const markdown = result?.data?.markdown || result?.markdown || '';
        const html = result?.data?.html || result?.html || '';
        const metadata = result?.data?.metadata || result?.metadata || {};
        const combinedContent = markdown + ' ' + html;
        
        // HTTP status codes are always reliable
        if (metadata.statusCode === 404 || metadata.statusCode === 410) {
          console.log(`⚠️ HTTP ${metadata.statusCode} for ${url}`);
          return { isInactive: true, reason: `http_${metadata.statusCode}` };
        }
        
        // Redirect check is reliable
        const redirectCheck = isRedirectDetected(url, metadata, source);
        if (redirectCheck.isRedirect) {
          return { isInactive: true, reason: redirectCheck.reason! };
        }
        
        const hasPropertyContent = hasPropertyIndicators(combinedContent);
        const hasRemovalContent = isListingRemoved(combinedContent);
        
        // PROPERTY INDICATORS FIRST - if page has real property data, it's active
        // This prevents false positives from temporary error pages or boilerplate text
        if (hasPropertyContent) {
          if (hasRemovalContent) {
            console.log(`⚠️ Both property AND removal indicators found for ${url} - keeping active (property data wins)`);
          }
          return { isInactive: false, reason: 'content_ok' };
        }
        
        // No property indicators - now check for removal
        if (hasRemovalContent) {
          // Safety check: if content is very short, it might be a temporary block/error page
          // Real removal pages on Yad2 are typically under 500 chars
          // But we should also not trust very short pages that might be proxy errors
          if (markdown.length < 200) {
            console.log(`⚠️ Removal indicator found but very short content (${markdown.length} chars) for ${url} - treating as temporary error`);
            // Don't mark as inactive - let it retry next cycle
            return { isInactive: false, reason: 'short_removal_page_suspicious' };
          }
          console.log(`🚫 Removal indicator found (no property data) for ${url}`);
          return { isInactive: true, reason: 'listing_removed_indicator' };
        }
        
        if (markdown.length < 500) {
          console.log(`⚠️ Short content (${markdown.length} chars), no indicators for ${url}`);
          return { isInactive: false, reason: 'short_content_no_indicators' };
        }
        
        console.log(`⚠️ Long content but no indicators for ${url}`);
        return { isInactive: false, reason: 'no_indicators_keeping_active' };
      }
      
      if (attempt < maxRetries) {
        const delay = retryDelayMs * attempt;
        console.log(`⚠️ Firecrawl attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isProxyError = errorMsg.includes('TUNNEL') || errorMsg.includes('PROXY');
      
      if (isProxyError && attempt < maxRetries) {
        const delay = retryDelayMs * attempt;
        console.log(`⚠️ Proxy error, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      console.error(`Firecrawl error for ${url}:`, errorMsg);
    }
  }
  
  return { isInactive: false, reason: 'firecrawl_failed_after_retries' };
}

/**
 * Check via direct fetch for sources not needing Firecrawl
 */
async function checkWithDirectFetch(
  url: string,
  headTimeoutMs: number,
  getTimeoutMs: number
): Promise<{ isInactive: boolean; reason: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), headTimeoutMs);

    const headResponse = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'manual'
    });

    clearTimeout(timeoutId);

    if (headResponse.status === 404 || headResponse.status === 410) {
      return { isInactive: true, reason: `http_status_${headResponse.status}` };
    }
    
    if (headResponse.status === 301 || headResponse.status === 302) {
      const location = headResponse.headers.get('location') || '';
      const isRedirectToHome = location.endsWith('/') || 
        (!location.includes('?') && !location.includes('/viewad'));
      
      if (isRedirectToHome) {
        return { isInactive: true, reason: 'redirect_to_home' };
      }
    }
    
    if (headResponse.status === 200) {
      try {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), getTimeoutMs);

        const getResponse = await fetch(url, {
          method: 'GET',
          signal: getController.signal,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        clearTimeout(getTimeoutId);

        if (getResponse.ok) {
          const html = await getResponse.text();
          
          if (isListingRemoved(html)) {
            return { isInactive: true, reason: 'listing_removed_indicator' };
          }
        }
        
        return { isInactive: false, reason: 'content_ok' };
      } catch {
        return { isInactive: false, reason: 'get_failed_head_ok' };
      }
    }
    
    return { isInactive: false, reason: 'head_status_ok' };
  } catch {
    return { isInactive: false, reason: 'fetch_error_keeping_active' };
  }
}

async function checkSingleProperty(
  property: PropertyToCheck,
  useFirecrawl: boolean,
  firecrawlApiKey: string | undefined,
  settings: any,
  timeoutMs: number
): Promise<CheckResult> {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('PROPERTY_TIMEOUT')), timeoutMs)
  );
  
  const checkPromise = (async (): Promise<CheckResult> => {
    const shouldUseFirecrawl = useFirecrawl && 
      ['yad2', 'madlan', 'homeless'].includes(property.source);
    
    let result: { isInactive: boolean; reason: string };
    
    if (shouldUseFirecrawl) {
      // HEAD-first: quick check before expensive Firecrawl call
      const headResult = await quickHeadCheck(property.source_url, property.source);
      if (headResult) {
        return { id: property.id, ...headResult };
      }
      
      result = await checkWithFirecrawl(
        property.source_url, 
        property.source, 
        firecrawlApiKey!,
        settings.firecrawl_max_retries,
        settings.firecrawl_retry_delay_ms
      );
    } else {
      result = await checkWithDirectFetch(
        property.source_url, 
        settings.head_timeout_ms, 
        settings.get_timeout_ms
      );
    }
    
    return { id: property.id, ...result };
  })();
  
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
  useFirecrawl: boolean,
  firecrawlApiKey: string | undefined,
  settings: any,
  abortSignal: AbortSignal
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const perPropertyTimeout = settings.per_property_timeout_ms || 15000;
  
  for (let i = 0; i < properties.length; i += concurrencyLimit) {
    // Check global abort before each chunk
    if (abortSignal.aborted) {
      console.log(`⏱️ Global timeout reached, stopping after ${results.length} results`);
      break;
    }
    
    const chunk = properties.slice(i, i + concurrencyLimit);
    console.log(`🔄 Processing chunk ${Math.floor(i / concurrencyLimit) + 1}`);
    
    const chunkPromises = chunk.map(prop => 
      checkSingleProperty(prop, useFirecrawl, firecrawlApiKey, settings, perPropertyTimeout)
    );
    
    const chunkResults = await Promise.allSettled(chunkPromises);
    
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
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const settings = await fetchCategorySettings(supabase, 'availability');
  const useFirecrawl = firecrawlApiKey && settings.use_firecrawl !== false;

  try {
    let propertyIds: string[] = [];
    
    try {
      const body = await req.json();
      if (body.property_ids && Array.isArray(body.property_ids)) {
        propertyIds = body.property_ids;
        console.log(`📋 Received ${propertyIds.length} property IDs`);
      }
    } catch {
      // No body
    }

    if (propertyIds.length === 0) {
      clearTimeout(globalTimeoutId);
      return new Response(JSON.stringify({
        success: true,
        message: 'No property IDs provided',
        checked: 0,
        marked_inactive: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: properties, error } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, title')
      .in('id', propertyIds);

    if (error) throw error;

    if (!properties || properties.length === 0) {
      clearTimeout(globalTimeoutId);
      return new Response(JSON.stringify({
        success: true,
        message: 'No properties found',
        checked: 0,
        marked_inactive: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`🔍 Checking ${properties.length} properties (global timeout: ${GLOBAL_TIMEOUT_MS}ms)`);

    const concurrencyLimit = settings.concurrency_limit || 3;
    const results = await processPropertiesInParallel(
      properties,
      concurrencyLimit,
      useFirecrawl,
      firecrawlApiKey,
      settings,
      globalAbortController.signal
    );

    clearTimeout(globalTimeoutId);

    let checkedCount = 0;
    let inactiveCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const inactiveIds: string[] = [];

    // Reasons that should NOT update availability_checked_at (property stays in queue for retry)
    const retryableReasons = new Set([
      'per_property_timeout', 
      'firecrawl_failed_after_retries', 
      'check_error',
      'short_removal_page_suspicious',
      'short_content_no_indicators'
    ]);

    for (const result of results) {
      checkedCount++;
      
      const isRetryable = result.error || retryableReasons.has(result.reason);
      
      if (isRetryable) {
        errorCount++;
        // DON'T update availability_checked_at - property stays in queue for retry
        try {
          await supabase
            .from('scouted_properties')
            .update({ availability_check_reason: result.reason })
            .eq('id', result.id);
          console.log(`🔄 ${result.id} - retryable (${result.reason}), stays in queue`);
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
        const updateData: Record<string, any> = {
          availability_checked_at: new Date().toISOString(),
          availability_check_reason: result.reason
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
      firecrawl_enabled: useFirecrawl,
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
