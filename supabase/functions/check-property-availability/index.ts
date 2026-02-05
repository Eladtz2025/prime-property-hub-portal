import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchCategorySettings } from "../_shared/settings.ts";
import { scrapeWithRetry } from "../_shared/scraping.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type for property from DB
interface PropertyToCheck {
  id: string;
  source_url: string;
  source: string;
  title: string;
}

// Type for check result
interface CheckResult {
  id: string;
  isInactive: boolean;
  reason: string;
  error?: boolean;
}

// Indicators that a listing has been removed (Hebrew and English) 
const LISTING_REMOVED_INDICATORS = [
  // Hebrew - general
  'המודעה הוסרה',
  'מודעה לא נמצאה',
  'הדף לא נמצא',
  'הנכס אינו זמין',
  'המודעה לא קיימת',
  'הדף המבוקש לא נמצא',
  'לא הצלחנו למצוא',
  // English
  'listing not found',
  'item removed',
  'page not found',
  'this listing is no longer available',
  'listing has been removed',
  'no longer exists',
  // Yad2 specific
  'חיפשנו בכל מקום אבל אין לנו עמוד כזה',
  'אין לנו עמוד כזה',
  'הלינק לא תקין',
  'העמוד שחיפשת הוסר',
  'חיפשנו בכל מקום',
  'אופס',
  'האתר בשיפוצים',
  // Madlan specific
  'הנכס לא נמצא',
  'הדירה אינה זמינה',
  'הנכס הוסר',
];

// Check if content indicates the listing was removed  
function isListingRemoved(content: string): boolean {
  // Note: Removed length < 100 check - short 404/error pages
  // should still be checked for removal indicators
  if (!content) return false;
  
  const lowerContent = content.toLowerCase();
  
  for (const indicator of LISTING_REMOVED_INDICATORS) {
    if (lowerContent.includes(indicator.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if Firecrawl metadata indicates a redirect away from item page
 * Uses sourceURL/finalURL from metadata rather than content matching
 */
function isRedirectDetected(
  originalUrl: string, 
  metadata: any, 
  source: string
): { isRedirect: boolean; reason?: string } {
  if (!metadata) return { isRedirect: false };
  
  // Get final URL from Firecrawl metadata
  const finalUrl = metadata.sourceURL || metadata.url || metadata.finalURL;
  if (!finalUrl) return { isRedirect: false };
  
  try {
    const originalPath = new URL(originalUrl).pathname;
    const finalPath = new URL(finalUrl).pathname;
    
    // For Yad2: check if still on /realestate/item/ path
    if (source === 'yad2') {
      const originalHasItem = originalPath.includes('/realestate/item/') || 
                             originalPath.includes('/item/');
      const finalHasItem = finalPath.includes('/realestate/item/') || 
                           finalPath.includes('/item/');
      
      // Original was item page but final is not = redirect
      if (originalHasItem && !finalHasItem) {
        console.log(`⚠️ Yad2 redirect detected: ${originalPath} → ${finalPath}`);
        return { isRedirect: true, reason: 'yad2_redirect_to_non_item' };
      }
      
      // Check if redirected to homepage
      if (finalPath === '/' || finalPath === '/realestate' || 
          finalPath === '/realestate/') {
        console.log(`⚠️ Yad2 redirect to homepage: ${finalPath}`);
        return { isRedirect: true, reason: 'yad2_redirect_to_homepage' };
      }
    }
    
    // For Madlan: similar logic
    if (source === 'madlan') {
      const originalHasProperty = originalPath.includes('/property/') || 
                                  originalPath.includes('/listing/');
      const finalHasProperty = finalPath.includes('/property/') || 
                               finalPath.includes('/listing/');
      
      if (originalHasProperty && !finalHasProperty) {
        return { isRedirect: true, reason: 'madlan_redirect_to_non_property' };
      }
    }
  } catch (urlError) {
    console.warn(`URL parsing error for redirect check: ${urlError}`);
  }
  
  return { isRedirect: false };
}

/**
 * Save debug sample for availability checks (non-critical, won't fail the check)
 */
async function saveDebugSample(
  supabase: SupabaseClient,
  url: string,
  source: string,
  markdown: string,
  metadata: any
): Promise<void> {
  try {
    // Prepare metadata as JSON string to append to markdown
    const metadataStr = metadata ? JSON.stringify({
      sourceURL: metadata.sourceURL,
      finalURL: metadata.finalURL,
      url: metadata.url,
      title: metadata.title,
      statusCode: metadata.statusCode
    }, null, 2) : '';
    
    // Combine markdown snippet + metadata
    const debugContent = [
      `--- DEBUG SAMPLE ---`,
      `URL: ${url}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Markdown length: ${markdown?.length || 0}`,
      `---`,
      markdown?.substring(0, 5000) || '(no content)',
      `--- METADATA ---`,
      metadataStr
    ].join('\n');
    
    await supabase.from('debug_scrape_samples').insert({
      source: 'yad2_availability',  // Constant source
      url: url,
      markdown: debugContent,
      html: null,
      properties_found: 0
    });
    
    console.log(`📝 Saved debug sample for ${url} (${markdown?.length || 0} chars)`);
  } catch (debugErr: any) {
    // Non-critical - table might not exist or no permissions
    // Just log to console, don't fail the check
    console.log(`📝 Debug sample not saved (${debugErr?.message || 'unknown error'}) - continuing`);
  }
}

// Check via Firecrawl for Yad2/Madlan (bypasses bot detection) with retry logic
async function checkWithFirecrawl(
  url: string, 
  source: string, 
  firecrawlApiKey: string,
  maxRetries: number,
  retryDelayMs: number,
  supabase?: SupabaseClient
): Promise<{ isInactive: boolean; reason: string }> {
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await scrapeWithRetry(url, firecrawlApiKey, source, 1, 3000);
      
      if (result) {
        const markdown = result?.data?.markdown || result?.markdown || '';
        const html = result?.data?.html || result?.html || '';
        const metadata = result?.data?.metadata || result?.metadata || {};
        const combinedContent = markdown + ' ' + html;
        
        // === Check 1: Detect redirect via Firecrawl metadata ===
        const redirectCheck = isRedirectDetected(url, metadata, source);
        if (redirectCheck.isRedirect) {
          return { isInactive: true, reason: redirectCheck.reason! };
        }
        
        // === Check 2: Removed listing indicators ===
        if (isListingRemoved(combinedContent)) {
          return { isInactive: true, reason: 'listing_removed_indicator_found' };
        }
        
        // === Check 3: Homepage/error page detection ===
        const hasPropertyIndicators = 
          combinedContent.includes('₪') || 
          combinedContent.includes('חדרים') ||
          combinedContent.includes('מ"ר') ||
          combinedContent.includes('מטר') ||
          combinedContent.includes('קומה');
        
        if (markdown.length < 500 && !hasPropertyIndicators) {
          console.log(`⚠️ Suspicious: short (${markdown.length} chars) + no property indicators`);
          return { isInactive: true, reason: 'homepage_or_error_detected' };
        }
        
        // === Check 4: Very short content without price - keep active ===
        if (markdown.length < 200 && !combinedContent.includes('₪')) {
          return { isInactive: false, reason: 'short_content_keeping_active' };
        }
        
        // === Save debug sample for Yad2 (non-critical) ===
        if (source === 'yad2' && supabase) {
          // Fire and forget - don't await, don't block
          saveDebugSample(supabase, url, source, markdown, metadata);
        }
        
        return { isInactive: false, reason: 'content_ok' };
      }
      
      // Scrape returned null - might be proxy error, retry
      if (attempt < maxRetries) {
        const delay = retryDelayMs * attempt;
        console.log(`⚠️ Firecrawl attempt ${attempt} failed for ${url}, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isProxyError = errorMsg.includes('TUNNEL') || 
                          errorMsg.includes('PROXY') || 
                          errorMsg.includes('ERR_');
      
      if (isProxyError && attempt < maxRetries) {
        const delay = retryDelayMs * attempt;
        console.log(`⚠️ Proxy error on attempt ${attempt} for ${url}: ${errorMsg}, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      console.error(`Firecrawl error for ${url}:`, errorMsg);
    }
  }
  
  // All retries failed - keep active but record the failure
  return { isInactive: false, reason: 'firecrawl_failed_after_retries' };
}

// Check via direct fetch for other sources (Homeless, etc.)
async function checkWithDirectFetch(
  url: string,
  headTimeoutMs: number,
  getTimeoutMs: number
): Promise<{ isInactive: boolean; reason: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), headTimeoutMs);

    // First, try HEAD request
    const headResponse = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'manual'
    });

    clearTimeout(timeoutId);

    // Check HTTP status
    if (headResponse.status === 404 || headResponse.status === 410) {
      return { isInactive: true, reason: `http_status_${headResponse.status}` };
    }
    
    // For redirects, check destination
    if (headResponse.status === 301 || headResponse.status === 302) {
      const location = headResponse.headers.get('location') || '';
      const isRedirectToHome = 
        location.endsWith('/') || 
        (!location.includes('?') && !location.includes('/viewad') && 
         !location.includes('/item/') && !location.includes('/property/'));
      
      if (isRedirectToHome) {
        return { isInactive: true, reason: 'redirect_to_home' };
      }
    }
    
    // For 200 OK, do a GET request to check content
    if (headResponse.status === 200) {
      try {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), getTimeoutMs);

        const getResponse = await fetch(url, {
          method: 'GET',
          signal: getController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        clearTimeout(getTimeoutId);

        if (getResponse.ok) {
          const html = await getResponse.text();
          
          if (isListingRemoved(html)) {
            return { isInactive: true, reason: 'listing_removed_indicator_found' };
          }
          
          // Very short page without proper HTML - likely an error
          if (html.length < 1000 && !html.includes('<!DOCTYPE')) {
            return { isInactive: false, reason: 'suspicious_short_page_keeping_active' };
          }
        }
        
        return { isInactive: false, reason: 'content_ok' };
      } catch {
        // GET request failed, but HEAD was OK - keep as active
        return { isInactive: false, reason: 'get_failed_head_ok' };
      }
    }
    
    return { isInactive: false, reason: 'head_status_ok' };
  } catch (error) {
    // Request failed completely - keep as active (conservative approach)
    return { isInactive: false, reason: 'fetch_error_keeping_active' };
  }
}

// Check a single property with timeout protection
async function checkSinglePropertyWithTimeout(
  property: PropertyToCheck,
  useFirecrawl: boolean,
  firecrawlApiKey: string | undefined,
  settings: any,
  timeoutMs: number,
  supabase?: SupabaseClient
): Promise<CheckResult> {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('PROPERTY_TIMEOUT')), timeoutMs)
  );
  
  const checkPromise = (async (): Promise<CheckResult> => {
    const shouldUseFirecrawl = useFirecrawl && ['yad2', 'madlan'].includes(property.source);
    
    let result: { isInactive: boolean; reason: string };
    
    if (shouldUseFirecrawl) {
      result = await checkWithFirecrawl(
        property.source_url, 
        property.source, 
        firecrawlApiKey!,
        settings.firecrawl_max_retries,
        settings.firecrawl_retry_delay_ms,
        supabase
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

// Process properties in parallel with concurrency limit
async function processPropertiesInParallel(
  properties: PropertyToCheck[],
  concurrencyLimit: number,
  useFirecrawl: boolean,
  firecrawlApiKey: string | undefined,
  settings: any,
  supabase?: SupabaseClient
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const perPropertyTimeout = settings.per_property_timeout_ms || 25000;
  
  // Process in chunks based on concurrency limit
  for (let i = 0; i < properties.length; i += concurrencyLimit) {
    const chunk = properties.slice(i, i + concurrencyLimit);
    
    console.log(`🔄 Processing chunk ${Math.floor(i / concurrencyLimit) + 1}: ${chunk.length} properties in parallel...`);
    
    const chunkPromises = chunk.map(prop => 
      checkSinglePropertyWithTimeout(
        prop,
        useFirecrawl,
        firecrawlApiKey,
        settings,
        perPropertyTimeout,
        supabase
      )
    );
    
    const chunkResults = await Promise.allSettled(chunkPromises);
    
    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // This shouldn't happen since we catch errors in checkSinglePropertyWithTimeout
        console.error('Unexpected promise rejection:', result.reason);
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

  // Fetch availability settings from database
  const settings = await fetchCategorySettings(supabase, 'availability');
  
  // Check if Firecrawl should be used
  const useFirecrawl = firecrawlApiKey && settings.use_firecrawl !== false;

  try {
    let propertyIds: string[] = [];
    
    // Get property IDs from request body
    try {
      const body = await req.json();
      if (body.property_ids && Array.isArray(body.property_ids) && body.property_ids.length > 0) {
        propertyIds = body.property_ids;
        console.log(`📋 Received ${propertyIds.length} property IDs`);
      }
    } catch {
      // No body or invalid JSON
    }

    if (propertyIds.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No property IDs provided',
        checked: 0,
        marked_inactive: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch properties by the provided IDs
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
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Checking ${properties.length} properties (Firecrawl: ${useFirecrawl ? 'ON' : 'OFF'})...`);

    // Get concurrency settings
    const concurrencyLimit = settings.concurrency_limit || 4;
    console.log(`⚡ Concurrency: ${concurrencyLimit}, Per-property timeout: ${settings.per_property_timeout_ms || 25000}ms`);

    // Process all properties with parallel execution
    const results = await processPropertiesInParallel(
      properties,
      concurrencyLimit,
      useFirecrawl,
      firecrawlApiKey,
      settings,
      supabase
    );

    // Update database for each result
    let checkedCount = 0;
    let inactiveCount = 0;
    let errorCount = 0;
    const inactiveIds: string[] = [];

    for (const result of results) {
      checkedCount++;
      
      if (result.error) {
        errorCount++;
        console.log(`⚠️ ${result.id} - Error/Timeout (${result.reason})`);
      } else if (result.isInactive) {
        inactiveCount++;
        inactiveIds.push(result.id);
        console.log(`❌ ${result.id} - INACTIVE (${result.reason})`);
      } else {
        console.log(`✓ ${result.id} - ACTIVE (${result.reason})`);
      }
      
      // Update database
      try {
        const updateData: Record<string, any> = {
          availability_checked_at: new Date().toISOString(),
          availability_check_reason: result.reason
        };
        
        if (result.isInactive) {
          updateData.is_active = false;
          updateData.status = 'inactive';
        }
        
        const { error: updateError } = await supabase
          .from('scouted_properties')
          .update(updateData)
          .eq('id', result.id);
        
        if (updateError) {
          console.error(`Failed to update ${result.id}: ${updateError.message}`);
        }
      } catch (dbError) {
        console.error(`DB update error for ${result.id}:`, dbError);
      }
    }

    console.log(`✅ Done: ${checkedCount} checked, ${inactiveCount} inactive, ${errorCount} errors/timeouts`);

    return new Response(JSON.stringify({
      success: true,
      checked: checkedCount,
      marked_inactive: inactiveCount,
      errors: errorCount,
      inactive_ids: inactiveIds,
      firecrawl_enabled: useFirecrawl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Availability check error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
