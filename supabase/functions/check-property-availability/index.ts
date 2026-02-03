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

// Check via Firecrawl for Yad2/Madlan (bypasses bot detection)
async function checkWithFirecrawl(
  url: string, 
  source: string, 
  firecrawlApiKey: string
): Promise<{ isInactive: boolean; reason?: string }> {
  try {
    // Single attempt with lightweight scrape (no retries for availability check)
    const result = await scrapeWithRetry(url, firecrawlApiKey, source, 1, 2000);
    
    if (!result) {
      // Scrape completely failed - could be 404 or blocked
      return { isInactive: false, reason: 'scrape_failed_keeping_active' };
    }
    
    const markdown = result?.data?.markdown || result?.markdown || '';
    const html = result?.data?.html || result?.html || '';
    const combinedContent = markdown + ' ' + html;
    
    // Check for removed listing indicators
    if (isListingRemoved(combinedContent)) {
      return { isInactive: true, reason: 'listing_removed_indicator_found' };
    }
    
    // Check for suspiciously short content (likely error page)
    if (markdown.length < 200 && !markdown.includes('₪')) {
      // Very short and no price - might be error page, but keep active to be safe
      return { isInactive: false, reason: 'short_content_keeping_active' };
    }
    
    return { isInactive: false };
  } catch (error) {
    console.error(`Firecrawl check error for ${url}:`, error);
    return { isInactive: false, reason: 'error_keeping_active' };
  }
}

// Check via direct fetch for other sources (Homeless, etc.)
async function checkWithDirectFetch(
  url: string,
  headTimeoutMs: number,
  getTimeoutMs: number
): Promise<{ isInactive: boolean; reason?: string }> {
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
      } catch {
        // GET request failed, but HEAD was OK - keep as active
        return { isInactive: false, reason: 'get_failed_head_ok' };
      }
    }
    
    return { isInactive: false };
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
  const availabilitySettings = await fetchCategorySettings(supabase, 'availability');
  
  // Check if Firecrawl should be used (default: true if API key exists)
  const useFirecrawl = firecrawlApiKey && availabilitySettings.use_firecrawl !== false;

  try {
    let propertyIds: string[] = [];
    
    // Try to get property IDs from request body
    try {
      const body = await req.json();
      if (body.property_ids && Array.isArray(body.property_ids) && body.property_ids.length > 0) {
        propertyIds = body.property_ids;
        console.log(`📋 Received ${propertyIds.length} property IDs from orchestrator`);
      }
    } catch {
      // No body or invalid JSON - will fetch own batch
    }

    let properties;

    if (propertyIds.length > 0) {
      // Fetch properties by the provided IDs
      const { data, error } = await supabase
        .from('scouted_properties')
        .select('id, source_url, source, title')
        .in('id', propertyIds);

      if (error) throw error;
      properties = data;
    } else {
      // Fallback: Fetch own batch (backward compatible for cron job)
      console.log('📋 No property IDs provided, fetching own batch...');
      
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - availabilitySettings.min_days_before_check);

      const { data, error } = await supabase
        .from('scouted_properties')
        .select('id, source_url, source, title')
        .in('status', ['matched', 'new'])
        .or('is_active.is.null,is_active.eq.true')
        .lt('first_seen_at', daysAgo.toISOString())
        .limit(availabilitySettings.batch_size);

      if (error) throw error;
      properties = data;
    }

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No properties to check',
        checked: 0,
        marked_inactive: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Checking ${properties.length} properties for availability (Firecrawl: ${useFirecrawl ? 'ON' : 'OFF'})...`);

    let checkedCount = 0;
    let inactiveCount = 0;
    const inactiveIds: string[] = [];

    for (const property of properties) {
      try {
        let result: { isInactive: boolean; reason?: string };
        
        // Use Firecrawl for Yad2 and Madlan (if enabled), direct fetch for others
        const shouldUseFirecrawl = useFirecrawl && ['yad2', 'madlan'].includes(property.source);
        
        if (shouldUseFirecrawl) {
          result = await checkWithFirecrawl(property.source_url, property.source, firecrawlApiKey!);
        } else {
          result = await checkWithDirectFetch(
            property.source_url, 
            availabilitySettings.head_timeout_ms, 
            availabilitySettings.get_timeout_ms
          );
        }
        
        checkedCount++;
        
        if (result.isInactive) {
          // Immediate update - don't wait until the end (prevents timeout data loss)
          const { error: updateError } = await supabase
            .from('scouted_properties')
            .update({ is_active: false, status: 'inactive' })
            .eq('id', property.id);
          
          if (!updateError) {
            inactiveIds.push(property.id);
            inactiveCount++;
            console.log(`❌ Property ${property.id} (${property.title}) - INACTIVE (${result.reason}) [SAVED]`);
          } else {
            console.error(`❌ Property ${property.id} - Failed to save: ${updateError.message}`);
          }
        } else if (result.reason) {
          console.log(`✓ Property ${property.id} - ACTIVE (${result.reason})`);
        }

      } catch (error) {
        console.log(`⚠️ Property ${property.id} - Error checking: ${error instanceof Error ? error.message : 'Unknown'}`);
        checkedCount++;
      }

      // Configurable delay between requests
      await new Promise(resolve => setTimeout(resolve, availabilitySettings.delay_between_requests_ms));
    }

    // Summary log (updates already happened immediately above)
    console.log(`✅ Availability check complete: ${checkedCount} checked, ${inactiveCount} marked inactive (immediate updates)`);

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
