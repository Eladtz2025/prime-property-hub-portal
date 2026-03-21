import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { 
  ScoutedProperty, 
  ContactLead, 
  MatchResult, 
  calculateMatch, 
  buildWhatsAppMessage, 
  cleanPhoneNumber,
  MatchingSettings,
  defaultMatchingSettings
} from "../_shared/matching.ts";
import { fetchCategorySettings } from "../_shared/settings.ts";

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
  const greenApiInstance = Deno.env.get('GREEN_API_INSTANCE_ID');
  const greenApiToken = Deno.env.get('GREEN_API_TOKEN');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { 
      property_ids, 
      run_id, 
      send_whatsapp = false,
      batch_index,
      total_batches,
      matching_settings: providedSettings
    } = await req.json();

    if (!property_ids || !Array.isArray(property_ids) || property_ids.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'property_ids array is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔄 Processing batch ${batch_index || '?'}/${total_batches || '?'} with ${property_ids.length} properties`);

    // Fetch the specific properties for this batch
    const { data: properties, error: propError } = await supabase
      .from('scouted_properties')
      .select('*')
      .in('id', property_ids)
      .not('price', 'is', null)
      .gt('price', 0)
      .or('duplicate_group_id.is.null,is_primary_listing.eq.true');

    if (propError) throw propError;

    if (!properties || properties.length === 0) {
      console.log('No properties found for this batch');
      return new Response(JSON.stringify({
        success: true,
        properties_processed: 0,
        leads_matched: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use provided settings from orchestrator, or fetch from DB as fallback
    let matchingSettings: MatchingSettings;
    if (providedSettings) {
      matchingSettings = providedSettings as MatchingSettings;
      console.log(`⚙️ Using pre-fetched matching settings from orchestrator`);
    } else {
      const matchingDbSettings = await fetchCategorySettings(supabase, 'matching');
      matchingSettings = {
        entry_date_range_strict: matchingDbSettings.entry_date_range_strict ?? defaultMatchingSettings.entry_date_range_strict,
        entry_date_range_flexible: matchingDbSettings.entry_date_range_flexible ?? defaultMatchingSettings.entry_date_range_flexible,
        immediate_max_days: matchingDbSettings.immediate_max_days ?? defaultMatchingSettings.immediate_max_days,
        rent_flex_low_threshold: matchingDbSettings.rent_flex_low_threshold ?? defaultMatchingSettings.rent_flex_low_threshold,
        rent_flex_low_percent: matchingDbSettings.rent_flex_low_percent ?? defaultMatchingSettings.rent_flex_low_percent,
        rent_flex_mid_threshold: matchingDbSettings.rent_flex_mid_threshold ?? defaultMatchingSettings.rent_flex_mid_threshold,
        rent_flex_mid_percent: matchingDbSettings.rent_flex_mid_percent ?? defaultMatchingSettings.rent_flex_mid_percent,
        rent_flex_high_percent: matchingDbSettings.rent_flex_high_percent ?? defaultMatchingSettings.rent_flex_high_percent,
      };
      console.log(`⚙️ Fetched matching settings from DB (fallback)`);
    }

    // Fetch all ELIGIBLE leads once for this batch
    // Lead eligibility is determined by database trigger (update_lead_eligibility)
    // which sets matching_status = 'eligible' when lead has: cities, neighborhoods, budget, rooms
    const PAGE_SIZE = 1000;
    let allLeads: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: leadBatch, error: leadsError } = await supabase
        .from('contact_leads')
        .select('*')
        .neq('status', 'closed')
        .eq('is_hidden', false)
        .eq('matching_status', 'eligible')  // Only eligible leads!
        .range(from, from + PAGE_SIZE - 1);

      if (leadsError) throw leadsError;
      
      if (leadBatch && leadBatch.length > 0) {
        allLeads = allLeads.concat(leadBatch);
        from += PAGE_SIZE;
        hasMore = leadBatch.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    const leads = allLeads;
    
    // Log eligible leads count (all have required fields thanks to trigger filter)
    console.log(`📊 Batch stats: ${properties.length} properties × ${leads.length} eligible leads`);

    if (leads.length === 0) {
      console.log('No active leads to match');
      return new Response(JSON.stringify({
        success: true,
        properties_processed: properties.length,
        leads_matched: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let totalMatched = 0;
    let totalWhatsAppSent = 0;
    let processedCount = 0;

    for (const property of properties) {
      const matches: MatchResult[] = [];

      for (const lead of leads) {
        const matchResult = await calculateMatch(property as ScoutedProperty, lead as ContactLead, matchingSettings);
        
        if (matchResult.matchScore >= 60) {
          matches.push(matchResult);
        }
      }
      
      processedCount++;

      // Sort by priority (higher = better quality match)
      matches.sort((a, b) => b.priority - a.priority);

      if (matches.length > 0) {
        totalMatched += matches.length;

        const matchedLeadsData = matches.map(m => ({
          lead_id: m.lead.id,
          name: m.lead.name,
          phone: m.lead.phone,
          score: m.matchScore,
          priority: m.priority, // Store priority for client-side sorting
          reasons: m.matchReasons
        }));

        // Update property with matched leads
        await supabase
          .from('scouted_properties')
          .update({
            matched_leads: matchedLeadsData,
            status: 'matched'
          })
          .eq('id', property.id);

        // If property belongs to a duplicate group, sync match data to all members (WITHOUT triggering WhatsApp)
        // This ensures the group has consistent data, but WhatsApp is only sent for the winner (above)
        if (property.duplicate_group_id) {
          // Sync data to losers in the group (they won't be processed for WhatsApp since they're filtered out)
          await supabase
            .from('scouted_properties')
            .update({
              matched_leads: matchedLeadsData,
              status: 'matched'
            })
            .eq('duplicate_group_id', property.duplicate_group_id)
            .neq('id', property.id);
          
          console.log(`Synced matches to duplicates in group ${property.duplicate_group_id} (data only, no WhatsApp)`);
        }

        // Send WhatsApp to matched leads (if enabled) - ONLY for winners (losers are already filtered out)
        if (send_whatsapp && greenApiInstance && greenApiToken) {
          for (const match of matches.slice(0, 5)) {
            const message = buildWhatsAppMessage(property as ScoutedProperty, match);
            
            try {
              const phone = cleanPhoneNumber(match.lead.phone);
              
              const waResponse = await fetch(
                `https://api.green-api.com/waInstance${greenApiInstance}/sendMessage/${greenApiToken}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chatId: `${phone}@c.us`,
                    message
                  })
                }
              );

              if (waResponse.ok) {
                totalWhatsAppSent++;
                
                await supabase.from('whatsapp_messages').insert({
                  phone: match.lead.phone,
                  message,
                  direction: 'outgoing',
                  status: 'sent',
                  sent_by: 'system'
                });
              }
            } catch (waError) {
              console.error('WhatsApp send error:', waError);
            }
          }
        }
      } else {
        // No matches: clear leads and keep as 'new' (NOT 'matched')
        await supabase
          .from('scouted_properties')
          .update({ status: 'checked', matched_leads: [] })
          .eq('id', property.id);
      }
    }

    // Update progress in tracking run using atomic increment
    if (run_id) {
      // Use RPC for atomic increment to avoid race conditions
      const { data: updatedProgress, error: rpcError } = await supabase
        .rpc('increment_matching_progress', {
          p_run_id: run_id,
          p_properties_count: processedCount,
          p_matches_count: totalMatched
        });

      if (rpcError) {
        console.error('RPC error:', rpcError);
      } else if (updatedProgress && updatedProgress.length > 0) {
        const progress = updatedProgress[0];
        console.log(`📊 Updated progress: ${progress.properties_found}/${progress.new_properties} (batch ${batch_index})`);
        
        // Check if this batch completed the run
        if (progress.properties_found >= progress.new_properties) {
          await supabase
            .from('scout_runs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', run_id);
          
          console.log(`🎉 Matching complete! Total matches: ${progress.leads_matched}`);
        }
      }

      // Update WhatsApp count separately (not in RPC)
      if (totalWhatsAppSent > 0) {
        const { data: currentRun } = await supabase
          .from('scout_runs')
          .select('whatsapp_sent')
          .eq('id', run_id)
          .single();
        
        if (currentRun) {
          await supabase
            .from('scout_runs')
            .update({
              whatsapp_sent: (currentRun.whatsapp_sent || 0) + totalWhatsAppSent
            })
            .eq('id', run_id);
        }
      }
    }

    console.log(`✅ Batch ${batch_index || '?'} complete: ${processedCount} properties, ${totalMatched} matches`);

    return new Response(JSON.stringify({
      success: true,
      properties_processed: processedCount,
      leads_matched: totalMatched,
      whatsapp_sent: totalWhatsAppSent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Match batch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
