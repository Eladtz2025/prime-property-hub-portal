import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchCategorySettings } from "../_shared/settings.ts";
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
// IMPORTANT: These are checked FIRST (Indicator-first approach)
const LISTING_REMOVED_INDICATORS = [
  // === Yad2 specific ===
  'חיפשנו בכל מקום אבל אין לנו עמוד כזה',
  'העמוד שחיפשת הוסר',
  'הלינק לא תקין',
  'מודעה לא נמצאה',
  'המודעה הוסרה',
  'אין לנו עמוד כזה',
  'חיפשנו בכל מקום',
  'אופס',
  'האתר בשיפוצים',
  
  // === Homeless specific ===
  'נראה שתקלה זו כבר טופלה',
  'טופלה וסגרה',
  'לפניכם חיפושים נוספים',
  'מודעות רלוונטיות',
  'המודעה לא נמצאה',
  'דף הבית של הומלס',
  
  // === Madlan specific ===
  'הנכס לא נמצא',
  'הדירה אינה זמינה',
  'הנכס הוסר',
  'לא נמצאו תוצאות',
  'הנכס כבר נמכר',
  'הנכס כבר הושכר',
  
  // === Hebrew general ===
  'הדף לא נמצא',
  'הנכס אינו זמין',
  'המודעה לא קיימת',
  'הדף המבוקש לא נמצא',
  'לא הצלחנו למצוא',
  
  // === English ===
  'listing not found',
  'item removed',
  'page not found',
  'this listing is no longer available',
  'listing has been removed',
  'no longer exists',
  'no longer available'
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

/**
 * Scrape for availability check with onlyMainContent: false
 * This ensures we capture 404/error page content
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
        onlyMainContent: false,  // KEY: Include ALL content including error messages
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
 * Debug logging for Yad2 - only on content_ok or suspicious results
 */
function logDebugInfo(
  url: string,
  markdown: string,
  html: string,
  metadata: any,
  combinedContent: string,
  reason: string
) {
  console.log(`\n🔍 DEBUG for ${url} (${reason}):`);
  console.log(`   markdown.length: ${markdown.length}`);
  console.log(`   html.length: ${html.length}`);
  console.log(`   metadata keys: ${Object.keys(metadata).join(', ')}`);
  console.log(`   metadata.sourceURL: ${metadata.sourceURL || 'N/A'}`);
  console.log(`   metadata.url: ${metadata.url || 'N/A'}`);
  console.log(`   metadata.statusCode: ${metadata.statusCode || 'N/A'}`);
  console.log(`   First 300 chars: ${combinedContent.substring(0, 300).replace(/\n/g, ' ')}`);
  console.log(`   === END DEBUG ===\n`);
}

// Check via Firecrawl for Yad2/Madlan/Homeless (bypasses bot detection) with retry logic
// Uses INDICATOR-FIRST approach: check removal indicators before anything else
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
      const result = await scrapeForAvailabilityCheck(url, firecrawlApiKey, source);
      
      if (result) {
        const markdown = result?.data?.markdown || result?.markdown || '';
        const html = result?.data?.html || result?.html || '';
        const metadata = result?.data?.metadata || result?.metadata || {};
        const combinedContent = markdown + ' ' + html;
        
        // === INDICATOR-FIRST: Check removal indicators BEFORE anything else ===
        // This is the most reliable check - look for explicit "listing removed" text
        if (isListingRemoved(combinedContent)) {
          console.log(`🚫 Removal indicator found for ${url}`);
          return { isInactive: true, reason: 'listing_removed_indicator' };
        }
        
        // === Check 2: HTTP status code backup ===
        if (metadata.statusCode === 404 || metadata.statusCode === 410) {
          console.log(`⚠️ HTTP ${metadata.statusCode} detected from metadata for ${url}`);
          return { isInactive: true, reason: `http_${metadata.statusCode}` };
        }
        
        // === Check 3: Detect redirect via Firecrawl metadata ===
        const redirectCheck = isRedirectDetected(url, metadata, source);
        if (redirectCheck.isRedirect) {
          return { isInactive: true, reason: redirectCheck.reason! };
        }
        
        // === Check 4: Has property indicators → definitely active ===
        const hasPropertyIndicators = 
          combinedContent.includes('₪') || 
          combinedContent.includes('חדרים') ||
          combinedContent.includes('מ"ר') ||
          combinedContent.includes('מטר') ||
          combinedContent.includes('קומה');
        
        if (hasPropertyIndicators) {
          // Save debug sample for Yad2 (non-critical)
          if (source === 'yad2' && supabase) {
            saveDebugSample(supabase, url, source, markdown, metadata);
            logDebugInfo(url, markdown, html, metadata, combinedContent, 'content_ok');
          }
          return { isInactive: false, reason: 'content_ok' };
        }
        
        // === Check 5: Short content without property indicators ===
        // This is a fallback - page might be captcha/block or error page
        if (markdown.length < 500) {
          console.log(`⚠️ Short content (${markdown.length} chars) without property indicators for ${url}`);
          if (source === 'yad2') {
            logDebugInfo(url, markdown, html, metadata, combinedContent, 'empty_or_error_page');
          }
          // Mark with clear reason for monitoring false positives
          return { isInactive: true, reason: 'empty_or_error_page' };
        }
        
        // === Default: Long content but no property indicators - suspicious but keep active ===
        console.log(`⚠️ Long content (${markdown.length} chars) but no indicators for ${url} - keeping active`);
        return { isInactive: false, reason: 'no_indicators_keeping_active' };
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
    // Use Firecrawl for yad2, madlan, AND homeless (to capture removal indicators)
    const shouldUseFirecrawl = useFirecrawl && ['yad2', 'madlan', 'homeless'].includes(property.source);
    
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
    let skippedCount = 0;
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
          // Inactive: update unconditionally (marking as inactive is always valid)
          updateData.is_active = false;
          updateData.status = 'inactive';
          
          const { error: updateError } = await supabase
            .from('scouted_properties')
            .update(updateData)
            .eq('id', result.id);
          
          if (updateError) {
            console.error(`Failed to update ${result.id}: ${updateError.message}`);
          }
        } else {
          // Active (content_ok): only update if still active (guard against race condition)
          const { data: updateResult, error: updateError } = await supabase
            .from('scouted_properties')
            .update(updateData)
            .eq('id', result.id)
            .eq('is_active', true)  // Guard: only update if still active
            .select('id');
          
          if (updateError) {
            console.error(`Failed to update ${result.id}: ${updateError.message}`);
          } else if (!updateResult || updateResult.length === 0) {
            // No rows updated = property was already inactive
            skippedCount++;
            console.log(`⏭️ ${result.id} - Skipped (already inactive by another process)`);
          }
        }
      } catch (dbError) {
        console.error(`DB update error for ${result.id}:`, dbError);
      }
    }

    if (skippedCount > 0) {
      console.log(`📊 Skipped ${skippedCount} properties that were already inactive`);
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
