import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  ScoutedProperty, 
  ContactLead, 
  MatchResult, 
  calculateMatch 
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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Starting reset-all-matches...');
    
    // Step 1: Clear all matched_leads from all properties
    const { error: clearError } = await supabase
      .from('scouted_properties')
      .update({ matched_leads: [], status: 'new' })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (clearError) throw clearError;
    console.log('Cleared all existing matches');

    // Step 2: Get all active scouted properties
    const { data: properties, error: propError } = await supabase
      .from('scouted_properties')
      .select('*')
      .eq('is_active', true);

    if (propError) throw propError;
    console.log(`Found ${properties?.length || 0} active properties`);

    // Step 3: Get all active leads
    const { data: leads, error: leadsError } = await supabase
      .from('contact_leads')
      .select('*')
      .neq('status', 'closed')
      .eq('is_hidden', false);

    if (leadsError) throw leadsError;
    console.log(`Found ${leads?.length || 0} active leads`);

    // Update matching_status for leads based on whether they have preferred neighborhoods
    for (const lead of leads || []) {
      const hasNeighborhoods = lead.preferred_neighborhoods && lead.preferred_neighborhoods.length > 0;
      const currentStatus = lead.matching_status;
      
      // Only update if status needs to change
      if (!hasNeighborhoods && currentStatus !== 'incomplete') {
        await supabase
          .from('contact_leads')
          .update({ matching_status: 'incomplete' })
          .eq('id', lead.id);
      } else if (hasNeighborhoods && currentStatus === 'incomplete') {
        await supabase
          .from('contact_leads')
          .update({ matching_status: 'active' })
          .eq('id', lead.id);
      }
    }

    // Step 4: Match properties to leads
    let totalMatched = 0;
    let propertiesWithMatches = 0;

    for (const property of properties || []) {
      const matches: MatchResult[] = [];
      
      // Get leads with neighborhoods (eligible for matching)
      const eligibleLeads = (leads || []).filter(
        lead => lead.preferred_neighborhoods && lead.preferred_neighborhoods.length > 0
      );

      for (const lead of eligibleLeads) {
        const matchResult = await calculateMatch(property as ScoutedProperty, lead as ContactLead);
        if (matchResult.matchScore >= 60) { // At least 60% match
          matches.push(matchResult);
        }
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      if (matches.length > 0) {
        totalMatched += matches.length;
        propertiesWithMatches++;

        // Update property with matched leads
        await supabase
          .from('scouted_properties')
          .update({
            matched_leads: matches.map(m => ({
              lead_id: m.lead.id,
              name: m.lead.name,
              phone: m.lead.phone,
              score: m.matchScore,
              reasons: m.matchReasons
            })),
            status: 'matched'
          })
          .eq('id', property.id);
      }
    }

    console.log(`Matching complete: ${totalMatched} total matches across ${propertiesWithMatches} properties`);

    return new Response(JSON.stringify({
      success: true,
      properties_total: properties?.length || 0,
      leads_total: leads?.length || 0,
      leads_eligible: (leads || []).filter(l => l.preferred_neighborhoods?.length > 0).length,
      properties_with_matches: propertiesWithMatches,
      total_matches: totalMatched
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Reset matches error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
