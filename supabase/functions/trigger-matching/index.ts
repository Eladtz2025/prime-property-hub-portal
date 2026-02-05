import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fetchCategorySettings } from "../_shared/settings.ts";
import { 
  ScoutedProperty, 
  ContactLead, 
  calculateMatch,
  MatchingSettings,
  defaultMatchingSettings
} from "../_shared/matching.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Single lead re-matching logic
 * This replaces the separate match-scouted-to-leads function
 */
async function rematchSingleLead(leadId: string, supabase: any): Promise<Response> {
  console.log(`🔄 Re-matching single lead: ${leadId}`);
  
  // Get the specific lead
  const { data: lead, error: leadError } = await supabase
    .from('contact_leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Lead not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Fetch matching settings from database
  const matchingDbSettings = await fetchCategorySettings(supabase, 'matching');
  const matchingSettings: MatchingSettings = {
    entry_date_range_strict: matchingDbSettings.entry_date_range_strict ?? defaultMatchingSettings.entry_date_range_strict,
    entry_date_range_flexible: matchingDbSettings.entry_date_range_flexible ?? defaultMatchingSettings.entry_date_range_flexible,
    immediate_max_days: matchingDbSettings.immediate_max_days ?? defaultMatchingSettings.immediate_max_days,
    // Price flexibility settings from admin
    rent_flex_low_threshold: matchingDbSettings.rent_flex_low_threshold ?? defaultMatchingSettings.rent_flex_low_threshold,
    rent_flex_low_percent: matchingDbSettings.rent_flex_low_percent ?? defaultMatchingSettings.rent_flex_low_percent,
    rent_flex_mid_threshold: matchingDbSettings.rent_flex_mid_threshold ?? defaultMatchingSettings.rent_flex_mid_threshold,
    rent_flex_mid_percent: matchingDbSettings.rent_flex_mid_percent ?? defaultMatchingSettings.rent_flex_mid_percent,
    rent_flex_high_percent: matchingDbSettings.rent_flex_high_percent ?? defaultMatchingSettings.rent_flex_high_percent,
  };
  
  console.log(`⚙️ Using settings: entry_strict=±${matchingSettings.entry_date_range_strict}d, flex=±${matchingSettings.entry_date_range_flexible}d, price_flex=${matchingSettings.rent_flex_low_percent}/${matchingSettings.rent_flex_mid_percent}/${matchingSettings.rent_flex_high_percent}`);

  // Get all active properties for matching (with pagination)
  const PAGE_SIZE = 1000;
  let allProperties: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: propBatch, error: propError } = await supabase
      .from('scouted_properties')
      .select('id, city, neighborhood, address, price, rooms, size, floor, property_type, title, description, is_private, source, source_url, features, matched_leads')
      .eq('is_active', true)
      .not('price', 'is', null)
      .gt('price', 0)
      .or('duplicate_group_id.is.null,is_primary_listing.eq.true')
      .range(from, from + PAGE_SIZE - 1);

    if (propError) throw propError;
    
    if (propBatch && propBatch.length > 0) {
      allProperties = allProperties.concat(propBatch);
      from += PAGE_SIZE;
      hasMore = propBatch.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  const properties = allProperties;
  console.log(`Lead re-match: Fetched ${properties.length} active properties`);

  // Process all properties and calculate matches in parallel
  const matchResults = await Promise.all(
    properties.map(async (property) => {
      const matchResult = await calculateMatch(property as ScoutedProperty, lead as ContactLead, matchingSettings);
      const currentMatches = property.matched_leads || [];
      
      // Remove this lead from current matches
      const filteredMatches = currentMatches.filter((m: any) => m.lead_id !== leadId);
      
      // Add back if score is high enough
      const isMatch = matchResult.matchScore >= 60;
      if (isMatch) {
        filteredMatches.push({
          lead_id: lead.id,
          name: lead.name,
          phone: lead.phone,
          score: matchResult.matchScore,
          priority: matchResult.priority,
          reasons: matchResult.matchReasons
        });
      }
      
      return {
        id: property.id,
        matched_leads: filteredMatches,
        hasMatches: filteredMatches.length > 0,
        isNewMatch: isMatch
      };
    })
  );

  // Batch update properties - group by 100 for efficiency
  const BATCH_SIZE = 100;
  let updatedCount = 0;
  
  for (let i = 0; i < matchResults.length; i += BATCH_SIZE) {
    const batch = matchResults.slice(i, i + BATCH_SIZE);
    
    // Use Promise.all for parallel updates within batch
    await Promise.all(batch.map(async (result) => {
      await supabase
        .from('scouted_properties')
        .update({
          matched_leads: result.matched_leads,
          status: result.hasMatches ? 'matched' : 'new'
        })
        .eq('id', result.id);
      
      if (result.isNewMatch) updatedCount++;
    }));
  }

  console.log(`✅ Lead ${leadId} re-matched: ${updatedCount} properties matched`);

  return new Response(JSON.stringify({
    success: true,
    lead_id: leadId,
    properties_checked: properties?.length || 0,
    matches_updated: updatedCount
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse request body for optional parameters
    const body = await req.json().catch(() => ({}));
    const sendWhatsapp = body.send_whatsapp ?? false;
    const isForced = body.force === true;
    const leadId = body.lead_id;

    // If lead_id is provided, handle single lead re-matching
    if (leadId) {
      return await rematchSingleLead(leadId, supabase);
    }

    // Fetch matching settings to check schedule
    const matchingSettings = await fetchCategorySettings(supabase, 'matching');
    const scheduleTimes: string[] = (matchingSettings as any).schedule_times || ['09:15', '18:15'];

    // Get current Israel time (HH:MM format)
    const now = new Date();
    const israelTime = now.toLocaleTimeString('en-GB', { 
      timeZone: 'Asia/Jerusalem', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Check if current time is in the schedule (unless forced)
    if (!isForced && !scheduleTimes.includes(israelTime)) {
      console.log(`⏭️ Skipping matching - ${israelTime} not in schedule [${scheduleTimes.join(', ')}]`);
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        message: `Not scheduled for ${israelTime}`,
        current_time: israelTime,
        scheduled_times: scheduleTimes
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`🎯 Starting matching orchestration at ${israelTime} (scheduled: [${scheduleTimes.join(', ')}])...`);

    // Create a tracking run for progress
    const { data: trackingRun, error: runError } = await supabase
      .from('scout_runs')
      .insert({
        source: 'matching',
        status: 'running',
        properties_found: 0,
        new_properties: 0
      })
      .select('id')
      .single();

    if (runError) {
      console.error('Error creating tracking run:', runError);
    }

    const trackingRunId = trackingRun?.id;
    console.log(`📊 Created tracking run: ${trackingRunId}`);

    // Fetch ALL active property IDs using pagination
    const PAGE_SIZE = 1000;
    let allPropertyIds: string[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: properties, error: fetchError } = await supabase
        .from('scouted_properties')
        .select('id')
        .eq('is_active', true)
        .not('price', 'is', null)
        .gt('price', 0)
        .or('duplicate_group_id.is.null,is_primary_listing.eq.true')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) throw fetchError;

      if (properties && properties.length > 0) {
        allPropertyIds = [...allPropertyIds, ...properties.map(p => p.id)];
        page++;
        hasMore = properties.length === PAGE_SIZE;
        console.log(`📄 Fetched page ${page}: ${properties.length} properties (total so far: ${allPropertyIds.length})`);
      } else {
        hasMore = false;
      }
    }

    if (allPropertyIds.length === 0) {
      console.log('✅ No properties to match');
      
      if (trackingRunId) {
        await supabase
          .from('scout_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            properties_found: 0,
            new_properties: 0
          })
          .eq('id', trackingRunId);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'No properties to match',
        total_properties: 0,
        batches_triggered: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Note: For matching runs, new_properties should be 0 (matching doesn't create new properties)
    // properties_found will be incremented by match-batch workers as they process batches
    console.log(`📊 Found ${allPropertyIds.length} properties to match`);

    // Split into batches of 50 properties (reduced from 100 to prevent timeouts)
    const batchSize = 50;
    const batches: string[][] = [];
    for (let i = 0; i < allPropertyIds.length; i += batchSize) {
      batches.push(allPropertyIds.slice(i, i + batchSize));
    }

    console.log(`📦 Split into ${batches.length} batches of ~${batchSize} properties each`);

    let triggeredCount = 0;

    // Trigger each batch with delay - FIRE AND FORGET
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      console.log(`🚀 Triggering batch ${i + 1}/${batches.length} (${batch.length} properties)...`);
      
      // Fire and forget - don't await the response
      fetch(`${supabaseUrl}/functions/v1/match-batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          property_ids: batch,
          run_id: trackingRunId,
          send_whatsapp: sendWhatsapp,
          batch_index: i + 1,
          total_batches: batches.length
        })
      }).then(response => {
        if (!response.ok) {
          console.error(`❌ Batch ${i + 1} returned error status: ${response.status}`);
        } else {
          console.log(`✅ Batch ${i + 1} triggered successfully`);
        }
      }).catch(error => {
        console.error(`❌ Error triggering batch ${i + 1}:`, error.message);
      });

      triggeredCount++;

      // Delay between triggering batches to spread the load (increased to prevent overload)
      if (i < batches.length - 1) {
        await sleep(1000); // 1 second between triggers
      }
    }

    console.log(`✅ Matching orchestration complete: ${triggeredCount}/${batches.length} batches triggered`);

    return new Response(JSON.stringify({
      success: true,
      total_properties: allPropertyIds.length,
      batches_triggered: triggeredCount,
      total_batches: batches.length,
      run_id: trackingRunId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Matching orchestration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
