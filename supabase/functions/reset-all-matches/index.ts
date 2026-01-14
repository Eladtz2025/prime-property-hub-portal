import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { matchNeighborhood } from "../_shared/locations.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoutedProperty {
  id: string;
  source: string;
  source_url: string;
  title: string;
  city: string;
  neighborhood: string;
  address: string;
  price: number;
  rooms: number;
  size: number;
  floor: number;
  property_type: 'rent' | 'sale';
  description: string;
  features: Record<string, boolean>;
}

interface ContactLead {
  id: string;
  name: string;
  phone: string;
  budget_min: number;
  budget_max: number;
  rooms_min: number;
  rooms_max: number;
  size_min: number;
  size_max: number;
  preferred_cities: string[];
  preferred_neighborhoods: string[];
  property_type: string;
  elevator_required: boolean;
  parking_required: boolean;
  balcony_required: boolean;
}

interface MatchResult {
  lead: ContactLead;
  matchScore: number;
  matchReasons: string[];
}

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

    if (!properties || properties.length === 0 || !leads || leads.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No properties or leads to match',
        properties_processed: properties?.length || 0,
        leads_checked: leads?.length || 0,
        total_matches: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let totalMatches = 0;
    let propertiesWithMatches = 0;

    // Step 4: For each property, calculate matches with all leads
    for (const property of properties) {
      const matches: { lead_id: string; name: string; phone: string; score: number; reasons: string[] }[] = [];

      for (const lead of leads) {
        const matchResult = calculateMatch(property, lead);
        if (matchResult.matchScore >= 60) {
          matches.push({
            lead_id: lead.id,
            name: lead.name,
            phone: lead.phone,
            score: matchResult.matchScore,
            reasons: matchResult.matchReasons
          });
        }
      }

      // Sort by score descending
      matches.sort((a, b) => b.score - a.score);

      // Update property with new matches
      await supabase
        .from('scouted_properties')
        .update({
          matched_leads: matches,
          status: matches.length > 0 ? 'matched' : 'new'
        })
        .eq('id', property.id);

      if (matches.length > 0) {
        propertiesWithMatches++;
        totalMatches += matches.length;
      }
    }

    console.log(`Completed: ${propertiesWithMatches} properties with matches, ${totalMatches} total matches`);

    return new Response(JSON.stringify({
      success: true,
      properties_processed: properties.length,
      leads_checked: leads.length,
      properties_with_matches: propertiesWithMatches,
      total_matches: totalMatches
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

// Helper function to calculate allowed price deviation
function getAllowedDeviation(price: number, propertyType: string, direction: 'up' | 'down'): number {
  if (propertyType === 'rent') {
    if (price <= 5000) return direction === 'up' ? 0.20 : 0.30;
    if (price <= 10000) return direction === 'up' ? 0.17 : 0.25;
    return direction === 'up' ? 0.15 : 0.20;
  } else {
    if (price <= 1500000) return direction === 'up' ? 0.15 : 0.25;
    if (price <= 3000000) return direction === 'up' ? 0.12 : 0.20;
    return direction === 'up' ? 0.10 : 0.15;
  }
}

function calculateMatch(property: ScoutedProperty, lead: ContactLead): MatchResult {
  // ===== STRICT FILTERS - No flexibility =====
  
  // Property type MUST match
  const leadPropertyType = lead.property_type;
  const propertyType = property.property_type;
  
  if (leadPropertyType && propertyType) {
    const isRental = propertyType === 'rent' && (leadPropertyType === 'rental' || leadPropertyType === 'rent');
    const isSale = propertyType === 'sale' && leadPropertyType === 'sale';
    
    if (!isRental && !isSale) {
      return { lead, matchScore: 0, matchReasons: ['סוג עסקה לא מתאים'] };
    }
  }
  
  // City MUST match if lead specified preferences
  if (lead.preferred_cities?.length && property.city) {
    const cityMatch = lead.preferred_cities.some(c => 
      property.city!.includes(c) || c.includes(property.city!)
    );
    if (!cityMatch) {
      return { lead, matchScore: 0, matchReasons: [`עיר לא מתאימה: ${property.city}`] };
    }
  }
  
  // Neighborhood MUST match if lead specified preferences
  if (lead.preferred_neighborhoods?.length && property.neighborhood) {
    const city = property.city || 'תל אביב יפו';
    const isNeighborhoodMatch = matchNeighborhood(property.neighborhood, lead.preferred_neighborhoods, city);
    if (!isNeighborhoodMatch) {
      return { lead, matchScore: 0, matchReasons: [`שכונה לא מתאימה: ${property.neighborhood}`] };
    }
  }
  
  // ===== FLEXIBLE SCORING =====
  let score = 0;
  let maxScore = 0;
  const reasons: string[] = [];
  
  if (propertyType === 'rent') {
    reasons.push('דירה להשכרה - מתאים לחיפוש');
  } else if (propertyType === 'sale') {
    reasons.push('דירה למכירה - מתאים לחיפוש');
  }

  // Price match (30 points)
  maxScore += 30;
  if (property.price && (lead.budget_min || lead.budget_max)) {
    const minBudget = lead.budget_min || 0;
    const maxBudget = lead.budget_max || Infinity;
    const propType = propertyType || 'rent';
    
    if (property.price >= minBudget && property.price <= maxBudget) {
      score += 30;
      reasons.push('מחיר בטווח התקציב');
    } else if (property.price < minBudget && minBudget > 0) {
      const allowedDown = getAllowedDeviation(minBudget, propType, 'down');
      const minAllowed = minBudget * (1 - allowedDown);
      if (property.price >= minAllowed) {
        score += 25;
        reasons.push('מחיר נמוך מהתקציב');
      }
    } else if (property.price > maxBudget && maxBudget < Infinity) {
      const allowedUp = getAllowedDeviation(maxBudget, propType, 'up');
      const maxAllowed = maxBudget * (1 + allowedUp);
      const percentAbove = ((property.price - maxBudget) / maxBudget) * 100;
      
      if (property.price <= maxAllowed) {
        if (percentAbove <= (allowedUp * 100) / 2) {
          score += 20;
          reasons.push(`מחיר מעט מעל התקציב (${Math.round(percentAbove)}%)`);
        } else {
          score += 10;
          reasons.push(`מחיר מעל התקציב (${Math.round(percentAbove)}%)`);
        }
      }
    }
  }

  // Rooms match (25 points)
  maxScore += 25;
  if (property.rooms && (lead.rooms_min || lead.rooms_max)) {
    const minRooms = lead.rooms_min || 0;
    const maxRooms = lead.rooms_max || Infinity;
    
    if (property.rooms >= minRooms && property.rooms <= maxRooms) {
      score += 25;
      reasons.push('מספר חדרים מתאים');
    } else if (property.rooms === minRooms - 0.5 || property.rooms === maxRooms + 0.5) {
      score += 15;
      reasons.push('מספר חדרים קרוב');
    }
  }

  // Size match (15 points)
  maxScore += 15;
  if (property.size && (lead.size_min || lead.size_max)) {
    const minSize = lead.size_min || 0;
    const maxSize = lead.size_max || Infinity;
    
    if (property.size >= minSize && property.size <= maxSize) {
      score += 15;
      reasons.push('גודל מתאים');
    } else if (property.size >= minSize * 0.9 && property.size <= maxSize * 1.1) {
      score += 10;
      reasons.push('גודל קרוב לדרישות');
    }
  }

  // City match (15 points)
  maxScore += 15;
  if (property.city && lead.preferred_cities?.length) {
    score += 15;
    reasons.push('עיר מועדפת');
  }

  // Neighborhood match (10 points)
  maxScore += 10;
  if (property.neighborhood && lead.preferred_neighborhoods?.length) {
    score += 10;
    reasons.push(`שכונה מועדפת: ${property.neighborhood}`);
  }

  // Features match (15 points)
  maxScore += 15;
  if (property.features) {
    if (lead.elevator_required) {
      if (property.features.elevator === true) {
        score += 5;
        reasons.push('יש מעלית ✓');
      } else if (property.features.elevator === false) {
        score -= 8;
        reasons.push('אין מעלית ✗');
      }
    }
    
    if (lead.parking_required) {
      if (property.features.parking === true) {
        score += 5;
        reasons.push('יש חניה ✓');
      } else if (property.features.parking === false) {
        score -= 8;
        reasons.push('אין חניה ✗');
      }
    }
    
    if (lead.balcony_required) {
      if (property.features.balcony === true) {
        score += 5;
        reasons.push('יש מרפסת ✓');
      } else if (property.features.balcony === false) {
        score -= 3;
        reasons.push('אין מרפסת');
      }
    }
  }

  const finalScore = Math.max(0, score);
  const matchScore = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;

  return {
    lead,
    matchScore,
    matchReasons: reasons
  };
}
