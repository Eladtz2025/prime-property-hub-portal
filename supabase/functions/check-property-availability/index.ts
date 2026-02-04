import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchCategorySettings } from "../_shared/settings.ts";
import { scrapeWithRetry } from "../_shared/scraping.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  if (!content || content.length < 100) return false;
  
  const lowerContent = content.toLowerCase();
  
  for (const indicator of LISTING_REMOVED_INDICATORS) {
    if (lowerContent.includes(indicator.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

// Check via Firecrawl for Yad2/Madlan (bypasses bot detection) with retry logic
async function checkWithFirecrawl(
  url: string, 
  source: string, 
  firecrawlApiKey: string,
  maxRetries: number,
  retryDelayMs: number
): Promise<{ isInactive: boolean; reason: string }> {
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await scrapeWithRetry(url, firecrawlApiKey, source, 1, 3000);
      
      if (result) {
        const markdown = result?.data?.markdown || result?.markdown || '';
        const html = result?.data?.html || result?.html || '';
        const combinedContent = markdown + ' ' + html;
        
        // Check for removed listing indicators
        if (isListingRemoved(combinedContent)) {
          return { isInactive: true, reason: 'listing_removed_indicator_found' };
        }
        
        // Check for suspiciously short content (likely error page)
        if (markdown.length < 200 && !markdown.includes('₪')) {
          return { isInactive: false, reason: 'short_content_keeping_active' };
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

    let checkedCount = 0;
    let inactiveCount = 0;
    const inactiveIds: string[] = [];

    for (const property of properties) {
      try {
        let result: { isInactive: boolean; reason: string };
        
        // Use Firecrawl for Yad2 and Madlan (if enabled), direct fetch for others
        const shouldUseFirecrawl = useFirecrawl && ['yad2', 'madlan'].includes(property.source);
        
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
        
        checkedCount++;
        
        // Always update availability_checked_at
        const updateData: Record<string, any> = {
          availability_checked_at: new Date().toISOString(),
          availability_check_reason: result.reason
        };
        
        if (result.isInactive) {
          updateData.is_active = false;
          updateData.status = 'inactive';
          inactiveIds.push(property.id);
          inactiveCount++;
          console.log(`❌ ${property.id} - INACTIVE (${result.reason})`);
        } else {
          console.log(`✓ ${property.id} - ACTIVE (${result.reason})`);
        }
        
        // Immediate update
        const { error: updateError } = await supabase
          .from('scouted_properties')
          .update(updateData)
          .eq('id', property.id);
        
        if (updateError) {
          console.error(`Failed to update ${property.id}: ${updateError.message}`);
        }

      } catch (error) {
        console.log(`⚠️ ${property.id} - Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        
        // Still update checked_at even on error
        await supabase
          .from('scouted_properties')
          .update({
            availability_checked_at: new Date().toISOString(),
            availability_check_reason: 'check_error'
          })
          .eq('id', property.id);
        
        checkedCount++;
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, settings.delay_between_requests_ms));
    }

    console.log(`✅ Done: ${checkedCount} checked, ${inactiveCount} inactive`);

    return new Response(JSON.stringify({
      success: true,
      checked: checkedCount,
      marked_inactive: inactiveCount,
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
