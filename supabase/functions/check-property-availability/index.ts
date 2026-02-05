// Edge Function: check-property-availability v2.0
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchCategorySettings } from "../_shared/settings.ts";
import { 
  isListingRemoved, 
  isRedirectDetected, 
  hasPropertyIndicators 
} from "../_shared/availability-indicators.ts";
// Removed unused import SupabaseClient

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
 * Check via Firecrawl with INDICATOR-FIRST approach
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
        
        // === INDICATOR-FIRST: Check removal indicators BEFORE anything else ===
        if (isListingRemoved(combinedContent)) {
          console.log(`🚫 Removal indicator found for ${url}`);
          return { isInactive: true, reason: 'listing_removed_indicator' };
        }
        
        // === Check 2: HTTP status code backup ===
        if (metadata.statusCode === 404 || metadata.statusCode === 410) {
          console.log(`⚠️ HTTP ${metadata.statusCode} for ${url}`);
          return { isInactive: true, reason: `http_${metadata.statusCode}` };
        }
        
        // === Check 3: Redirect detection ===
        const redirectCheck = isRedirectDetected(url, metadata, source);
        if (redirectCheck.isRedirect) {
          return { isInactive: true, reason: redirectCheck.reason! };
        }
        
        // === Check 4: Has property indicators → definitely active ===
        if (hasPropertyIndicators(combinedContent)) {
          return { isInactive: false, reason: 'content_ok' };
        }
        
        // === Check 5: Short content without indicators ===
        if (markdown.length < 500) {
          console.log(`⚠️ Short content (${markdown.length} chars) for ${url}`);
          return { isInactive: true, reason: 'empty_or_error_page' };
        }
        
        // === Default: Long content but no indicators ===
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
  settings: any
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const perPropertyTimeout = settings.per_property_timeout_ms || 25000;
  
  for (let i = 0; i < properties.length; i += concurrencyLimit) {
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
      return new Response(JSON.stringify({
        success: true,
        message: 'No properties found',
        checked: 0,
        marked_inactive: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`🔍 Checking ${properties.length} properties`);

    const concurrencyLimit = settings.concurrency_limit || 4;
    const results = await processPropertiesInParallel(
      properties,
      concurrencyLimit,
      useFirecrawl,
      firecrawlApiKey,
      settings
    );

    let checkedCount = 0;
    let inactiveCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const inactiveIds: string[] = [];

    for (const result of results) {
      checkedCount++;
      
      if (result.error) {
        errorCount++;
      } else if (result.isInactive) {
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

    console.log(`✅ Done: ${checkedCount} checked, ${inactiveCount} inactive`);

    return new Response(JSON.stringify({
      success: true,
      checked: checkedCount,
      marked_inactive: inactiveCount,
      errors: errorCount,
      inactive_ids: inactiveIds,
      firecrawl_enabled: useFirecrawl
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
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
