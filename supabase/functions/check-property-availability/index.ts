import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchCategorySettings } from "../_shared/settings.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Indicators that a listing has been removed (Hebrew and English)
const LISTING_REMOVED_INDICATORS = [
  'המודעה הוסרה',
  'מודעה לא נמצאה',
  'הדף לא נמצא',
  'הנכס אינו זמין',
  'המודעה לא קיימת',
  'listing not found',
  'item removed',
  'page not found',
  'this listing is no longer available',
  'האתר בשיפוצים',
  // Yad2 specific indicators
  'חיפשנו בכל מקום אבל אין לנו עמוד כזה',
  'אין לנו עמוד כזה',
  'הלינק לא תקין',
  'העמוד שחיפשת הוסר',
  'listing has been removed',
  'no longer exists',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch availability settings from database
  const availabilitySettings = await fetchCategorySettings(supabase, 'availability');

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

    console.log(`🔍 Checking ${properties.length} properties for availability...`);

    let checkedCount = 0;
    let inactiveCount = 0;
    const inactiveIds: string[] = [];

    for (const property of properties) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), availabilitySettings.head_timeout_ms);

        // First, try HEAD request
        const headResponse = await fetch(property.source_url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PropertyChecker/1.0)'
          },
          redirect: 'manual'
        });

        clearTimeout(timeoutId);
        checkedCount++;

        let isInactive = false;

        // Check HTTP status
        if (headResponse.status === 404 || headResponse.status === 410) {
          isInactive = true;
          console.log(`❌ Property ${property.id} (${property.title}) - INACTIVE (status ${headResponse.status})`);
        } 
        // For redirects, check destination
        else if (headResponse.status === 301 || headResponse.status === 302) {
          const location = headResponse.headers.get('location') || '';
          const isRedirectToHome = 
            location.endsWith('/') || 
            (!location.includes('?') && !location.includes('/viewad') && !location.includes('/item/') && !location.includes('/property/'));
          
          if (isRedirectToHome) {
            isInactive = true;
            console.log(`❌ Property ${property.id} (${property.title}) - INACTIVE (redirect to home)`);
          }
        }
        // For 200 OK, do a GET request to check content for "listing removed" messages
        else if (headResponse.status === 200) {
          try {
            const getController = new AbortController();
            const getTimeoutId = setTimeout(() => getController.abort(), availabilitySettings.get_timeout_ms);

            const getResponse = await fetch(property.source_url, {
              method: 'GET',
              signal: getController.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });

            clearTimeout(getTimeoutId);

            if (getResponse.ok) {
              const html = await getResponse.text();
              const htmlLower = html.toLowerCase();

              // Check for "listing removed" indicators
              const hasRemovedIndicator = LISTING_REMOVED_INDICATORS.some(
                indicator => htmlLower.includes(indicator.toLowerCase())
              );

              // Also check if the page is suspiciously short (might be an error page)
              const isSuspiciouslyShort = html.length < 1000;

              if (hasRemovedIndicator) {
                isInactive = true;
                console.log(`❌ Property ${property.id} (${property.title}) - INACTIVE (listing removed message found)`);
              } else if (isSuspiciouslyShort && !html.includes('<!DOCTYPE')) {
                // Very short page without proper HTML - likely an error
                console.log(`⚠️ Property ${property.id} - Suspicious short page (${html.length} chars), keeping active`);
              }
            }
          } catch (getError) {
            // GET request failed, but HEAD was OK - keep as active
            console.log(`⚠️ Property ${property.id} - GET failed but HEAD OK, keeping active`);
          }
        }

        if (isInactive) {
          inactiveIds.push(property.id);
          inactiveCount++;
        }

      } catch (error) {
        // Request failed completely - keep as active (conservative approach)
        console.log(`⚠️ Property ${property.id} - Error checking: ${error.message}`);
        checkedCount++;
      }

      // Configurable delay between requests
      await new Promise(resolve => setTimeout(resolve, availabilitySettings.delay_between_requests_ms));
    }

    // Update inactive properties
    if (inactiveIds.length > 0) {
      const { error: updateError } = await supabase
        .from('scouted_properties')
        .update({ is_active: false, status: 'inactive' })
        .in('id', inactiveIds);

      if (updateError) {
        console.error('❌ Error updating inactive properties:', updateError);
      } else {
        console.log(`✅ Marked ${inactiveIds.length} properties as inactive`);
      }
    }

    console.log(`✅ Availability check complete: ${checkedCount} checked, ${inactiveCount} marked inactive`);

    return new Response(JSON.stringify({
      success: true,
      checked: checkedCount,
      marked_inactive: inactiveCount,
      inactive_ids: inactiveIds
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