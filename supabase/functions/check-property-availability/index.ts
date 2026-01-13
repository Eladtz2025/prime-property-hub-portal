import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get properties that are:
    // 1. Status is matched (processed)
    // 2. is_active is true (or null - old records)
    // 3. Added more than 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: properties, error: fetchError } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, title')
      .eq('status', 'matched')
      .or('is_active.is.null,is_active.eq.true')
      .lt('first_seen_at', threeDaysAgo.toISOString())
      .limit(50); // Process 50 at a time to avoid timeout

    if (fetchError) throw fetchError;

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

    console.log(`Checking ${properties.length} properties for availability...`);

    let checkedCount = 0;
    let inactiveCount = 0;
    const inactiveIds: string[] = [];

    for (const property of properties) {
      try {
        // Make a HEAD request to check if the URL is still accessible
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(property.source_url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PropertyChecker/1.0)'
          },
          redirect: 'manual' // Don't follow redirects automatically
        });

        clearTimeout(timeoutId);
        checkedCount++;

        // Check if the page is unavailable
        const isInactive = 
          response.status === 404 || 
          response.status === 410 || 
          response.status === 301 || // Permanent redirect (often means listing removed)
          response.status === 302;   // Temporary redirect to homepage

        // For redirects, check if it's redirecting to homepage
        if (response.status === 301 || response.status === 302) {
          const location = response.headers.get('location') || '';
          // If redirecting to homepage or a generic page, consider inactive
          const isRedirectToHome = 
            location.endsWith('/') || 
            location.includes('?') === false && !location.includes('/viewad') && !location.includes('/item/');
          
          if (isRedirectToHome) {
            inactiveIds.push(property.id);
            inactiveCount++;
            console.log(`Property ${property.id} (${property.title}) - INACTIVE (redirect to home)`);
          }
        } else if (isInactive) {
          inactiveIds.push(property.id);
          inactiveCount++;
          console.log(`Property ${property.id} (${property.title}) - INACTIVE (status ${response.status})`);
        }

      } catch (error) {
        // If request fails completely (timeout, network error), assume still active
        // This is a conservative approach - we don't want to mark active listings as inactive
        console.log(`Property ${property.id} - Error checking: ${error.message}`);
        checkedCount++;
      }

      // Small delay between requests to be respectful to the servers
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Update inactive properties
    if (inactiveIds.length > 0) {
      const { error: updateError } = await supabase
        .from('scouted_properties')
        .update({ is_active: false, status: 'inactive' })
        .in('id', inactiveIds);

      if (updateError) {
        console.error('Error updating inactive properties:', updateError);
      }
    }

    console.log(`Availability check complete: ${checkedCount} checked, ${inactiveCount} marked inactive`);

    return new Response(JSON.stringify({
      success: true,
      checked: checkedCount,
      marked_inactive: inactiveCount,
      inactive_ids: inactiveIds
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Availability check error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
