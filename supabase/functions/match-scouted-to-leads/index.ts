import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  ScoutedProperty, 
  ContactLead, 
  MatchResult, 
  calculateMatch, 
  buildWhatsAppMessage, 
  cleanPhoneNumber 
} from "../_shared/matching.ts";

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
    const { property_id, lead_id, send_whatsapp = true, run_id } = await req.json();
    
    // Create a tracking run for progress
    let trackingRunId = run_id;
    if (!trackingRunId && !lead_id) {
      const { data: newRun, error: runError } = await supabase
        .from('scout_runs')
        .insert({
          source: 'matching',
          status: 'running',
          properties_found: 0,
          new_properties: 0
        })
        .select('id')
        .single();
      
      if (!runError && newRun) {
        trackingRunId = newRun.id;
        console.log(`Created tracking run: ${trackingRunId}`);
      }
    }

    // If lead_id is provided, re-match this specific lead against all relevant properties
    if (lead_id) {
      console.log(`Re-matching lead ${lead_id}`);
      
      // Get the specific lead
      const { data: lead, error: leadError } = await supabase
        .from('contact_leads')
        .select('*')
        .eq('id', lead_id)
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

      // Get all active properties for matching (with pagination)
      const PAGE_SIZE = 1000;
      let allProperties: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: propBatch, error: propError } = await supabase
          .from('scouted_properties')
          .select('*')
          .eq('is_active', true)
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

      let updatedCount = 0;

      for (const property of properties || []) {
        const matchResult = calculateMatch(property as ScoutedProperty, lead as ContactLead);
        const currentMatches = property.matched_leads || [];
        
        // Remove this lead from current matches
        const filteredMatches = currentMatches.filter((m: any) => m.lead_id !== lead_id);
        
        // Add back if score is high enough
        if (matchResult.matchScore >= 60) {
          filteredMatches.push({
            lead_id: lead.id,
            name: lead.name,
            phone: lead.phone,
            score: matchResult.matchScore,
            reasons: matchResult.matchReasons
          });
          updatedCount++;
        }

        // Update property with new matches
        await supabase
          .from('scouted_properties')
          .update({
            matched_leads: filteredMatches,
            status: filteredMatches.length > 0 ? 'matched' : 'new'
          })
          .eq('id', property.id);
      }

      return new Response(JSON.stringify({
        success: true,
        lead_id,
        properties_checked: properties?.length || 0,
        matches_updated: updatedCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Match all active properties to all active leads (with pagination)
    const PAGE_SIZE = 1000;
    let allProperties: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('scouted_properties')
        .select('*')
        .eq('is_active', true)
        .range(from, from + PAGE_SIZE - 1);

      if (property_id) {
        query = query.eq('id', property_id);
      }

      const { data: propBatch, error: propError } = await query;

      if (propError) throw propError;
      
      if (propBatch && propBatch.length > 0) {
        allProperties = allProperties.concat(propBatch);
        from += PAGE_SIZE;
        hasMore = propBatch.length === PAGE_SIZE && !property_id; // Stop if filtering by specific property
      } else {
        hasMore = false;
      }
    }

    const properties = allProperties;
    console.log(`Fetched ${properties.length} active properties for matching`);

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No new properties to match',
        matched: 0,
        whatsapp_sent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get active leads (with pagination)
    let allLeads: any[] = [];
    from = 0;
    hasMore = true;

    while (hasMore) {
      const { data: leadBatch, error: leadsError } = await supabase
        .from('contact_leads')
        .select('*')
        .neq('status', 'closed')
        .eq('is_hidden', false)
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
    console.log(`Fetched ${leads.length} active leads for matching`);

    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No active leads to match',
        matched: 0,
        whatsapp_sent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let totalMatched = 0;
    let totalWhatsAppSent = 0;

    let processedCount = 0;
    const totalToProcess = properties.length;
    
    for (const property of properties) {
      const matches: MatchResult[] = [];

      for (const lead of leads) {
        const matchResult = calculateMatch(property as ScoutedProperty, lead as ContactLead);
        
        // Debug logging for specific leads that should match
        if (lead.name && lead.name.includes('רוני') && matchResult.matchScore < 60) {
          console.log(`DEBUG רוני: Property ${property.title} (${property.neighborhood}, ${property.price}₪, ${property.rooms} rooms)`);
          console.log(`  Lead preferences: neighborhoods=${lead.preferred_neighborhoods}, budget=${lead.budget_min}-${lead.budget_max}, rooms=${lead.rooms_min}-${lead.rooms_max}`);
          console.log(`  Match score: ${matchResult.matchScore}, reasons: ${matchResult.matchReasons.join(', ')}`);
        }
        
        if (matchResult.matchScore >= 60) { // At least 60% match
          matches.push(matchResult);
        }
      }
      
      processedCount++;
      
      // Update progress every 100 properties
      if (trackingRunId && processedCount % 100 === 0) {
        await supabase
          .from('scout_runs')
          .update({
            properties_found: processedCount,
            new_properties: 0  // Matching doesn't create new properties
          })
          .eq('id', trackingRunId);
        console.log(`Progress: ${processedCount}/${totalToProcess}`);
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      if (matches.length > 0) {
        totalMatched += matches.length;

        const matchedLeadsData = matches.map(m => ({
          lead_id: m.lead.id,
          name: m.lead.name,
          phone: m.lead.phone,
          score: m.matchScore,
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

        // If property belongs to a duplicate group, update all properties in the group
        if (property.duplicate_group_id) {
          const { data: duplicateProperties } = await supabase
            .from('scouted_properties')
            .select('id')
            .eq('duplicate_group_id', property.duplicate_group_id)
            .neq('id', property.id);

          if (duplicateProperties && duplicateProperties.length > 0) {
            for (const dup of duplicateProperties) {
              await supabase
                .from('scouted_properties')
                .update({
                  matched_leads: matchedLeadsData,
                  status: 'matched'
                })
                .eq('id', dup.id);
            }
            console.log(`Synced matches to ${duplicateProperties.length} duplicates in group ${property.duplicate_group_id}`);
          }
        }

        // Send WhatsApp to matched leads
        if (send_whatsapp && greenApiInstance && greenApiToken) {
          for (const match of matches.slice(0, 5)) { // Max 5 leads per property
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
                
                // Log the message
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
        // No matches, just mark as matched (processed)
        await supabase
          .from('scouted_properties')
          .update({ status: 'matched', matched_leads: [] })
          .eq('id', property.id);
      }
    }

    // Update run stats and mark as completed
    if (trackingRunId) {
      await supabase
        .from('scout_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          properties_found: processedCount,
          new_properties: 0,  // Matching doesn't create new properties
          leads_matched: totalMatched,
          whatsapp_sent: totalWhatsAppSent
        })
        .eq('id', trackingRunId);
    }

    return new Response(JSON.stringify({
      success: true,
      properties_processed: properties.length,
      leads_matched: totalMatched,
      whatsapp_sent: totalWhatsAppSent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Match error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
