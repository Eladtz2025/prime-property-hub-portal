import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  ScoutedProperty, 
  ContactLead, 
  calculateMatch,
  MatchingSettings,
  defaultMatchingSettings
} from "../_shared/matching.ts";
import { fetchCategorySettings } from "../_shared/settings.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * This function handles SINGLE LEAD re-matching only.
 * For full matching of all properties/leads, use trigger-matching orchestrator.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { lead_id } = await req.json();
    
    // This function now ONLY handles single-lead re-matching
    if (!lead_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'lead_id is required. For full matching, use trigger-matching instead.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    // Fetch matching settings from database
    const matchingDbSettings = await fetchCategorySettings(supabase, 'matching');
    const matchingSettings: MatchingSettings = {
      entry_date_range_strict: matchingDbSettings.entry_date_range_strict ?? defaultMatchingSettings.entry_date_range_strict,
      entry_date_range_flexible: matchingDbSettings.entry_date_range_flexible ?? defaultMatchingSettings.entry_date_range_flexible,
      immediate_max_days: matchingDbSettings.immediate_max_days ?? defaultMatchingSettings.immediate_max_days,
    };
    
    console.log(`⚙️ Using settings: strict=±${matchingSettings.entry_date_range_strict}d, flex=±${matchingSettings.entry_date_range_flexible}d`);

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
      const matchResult = await calculateMatch(property as ScoutedProperty, lead as ContactLead, matchingSettings);
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
          priority: matchResult.priority,
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

    console.log(`✅ Lead ${lead_id} re-matched: ${updatedCount} properties matched`);

    return new Response(JSON.stringify({
      success: true,
      lead_id,
      properties_checked: properties?.length || 0,
      matches_updated: updatedCount
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
