// Match our internal properties (properties table) to eligible leads
// Uses the SAME _shared/matching.ts logic as scouted_properties → single source of truth
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  ScoutedProperty,
  ContactLead,
  MatchResult,
  calculateMatch,
  defaultMatchingSettings,
} from "../_shared/matching.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert internal property row → ScoutedProperty shape that matching.ts expects
function adaptOwnProperty(p: Record<string, unknown>): ScoutedProperty {
  const propertyType = p.property_type === 'rental' ? 'rent'
                     : p.property_type === 'sale' ? 'sale'
                     : (p.property_type as string);

  // Build features jsonb from boolean columns. NULL → undefined (treated as "unknown" by matching.ts)
  const features: Record<string, boolean> = {};
  if (p.parking !== null && p.parking !== undefined) features.parking = p.parking as boolean;
  if (p.elevator !== null && p.elevator !== undefined) features.elevator = p.elevator as boolean;
  if (p.balcony !== null && p.balcony !== undefined) features.balcony = p.balcony as boolean;
  if (p.mamad !== null && p.mamad !== undefined) features.mamad = p.mamad as boolean;
  if (p.yard !== null && p.yard !== undefined) features.yard = p.yard as boolean;
  if (p.has_storage !== null && p.has_storage !== undefined) (features as Record<string, unknown>).storage = p.has_storage;

  const price = (propertyType === 'sale')
    ? (p.current_market_value as number) || (p.acquisition_cost as number) || 0
    : (p.monthly_rent as number) || 0;

  return {
    id: p.id as string,
    source: 'internal',
    source_url: '',
    title: (p.title as string) || (p.address as string) || '',
    city: (p.city as string) || '',
    neighborhood: (p.neighborhood as string) || '',
    address: (p.address as string) || '',
    price: Math.round(price),
    rooms: (p.rooms as number) || 0,
    size: (p.property_size as number) || 0,
    floor: (p.floor as number) || 0,
    property_type: propertyType as 'rent' | 'sale',
    description: (p.description as string) || '',
    features,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const propertyIds: string[] | undefined = body.property_ids;
    const leadId: string | undefined = body.lead_id;

    // Fetch properties
    let propsQuery = supabase
      .from('properties')
      .select('id, title, address, city, neighborhood, monthly_rent, current_market_value, acquisition_cost, rooms, property_size, floor, property_type, parking, elevator, balcony, mamad, yard, has_storage, description, available')
      .eq('available', true)
      .in('property_type', ['rental', 'sale']);

    if (propertyIds && propertyIds.length > 0) {
      propsQuery = propsQuery.in('id', propertyIds);
    }

    const { data: properties, error: propError } = await propsQuery;
    if (propError) throw propError;

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ success: true, properties_processed: 0, matches_created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch eligible leads
    let leadsQuery = supabase
      .from('contact_leads')
      .select('*')
      .neq('status', 'closed')
      .eq('is_hidden', false)
      .eq('matching_status', 'eligible');

    if (leadId) leadsQuery = leadsQuery.eq('id', leadId);

    const { data: leads, error: leadsError } = await leadsQuery;
    if (leadsError) throw leadsError;

    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({ success: true, properties_processed: properties.length, matches_created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`🏠 Matching ${properties.length} own properties × ${leads.length} eligible leads`);

    let totalMatches = 0;
    const propertyIdsProcessed: string[] = [];

    for (const property of properties) {
      const adapted = adaptOwnProperty(property);
      propertyIdsProcessed.push(property.id);

      // Skip properties without minimum data needed
      if (!adapted.price || adapted.price <= 0 || !adapted.city) continue;

      const matchRows: { property_id: string; lead_id: string; match_score: number; priority: number; match_reasons: string[] }[] = [];

      for (const lead of leads) {
        const result: MatchResult = await calculateMatch(adapted, lead as ContactLead, defaultMatchingSettings);
        if (result.matchScore >= 60) {
          matchRows.push({
            property_id: property.id,
            lead_id: lead.id,
            match_score: result.matchScore,
            priority: result.priority,
            match_reasons: result.matchReasons,
          });
        }
      }

      // Clear old matches for this property (only for the leads we just evaluated, to support targeted runs)
      const evaluatedLeadIds = leads.map((l: { id: string }) => l.id);
      await supabase
        .from('own_property_matches')
        .delete()
        .eq('property_id', property.id)
        .in('lead_id', evaluatedLeadIds);

      if (matchRows.length > 0) {
        const { error: insError } = await supabase.from('own_property_matches').insert(matchRows);
        if (insError) console.error(`Insert matches failed for ${property.id}:`, insError);
        else totalMatches += matchRows.length;
      }
    }

    console.log(`✅ Done: ${propertyIdsProcessed.length} properties, ${totalMatches} matches`);

    return new Response(JSON.stringify({
      success: true,
      properties_processed: propertyIdsProcessed.length,
      matches_created: totalMatches,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ match-own-properties error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
