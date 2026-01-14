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
  yard_required: boolean;
  // Flexibility flags - if false, the requirement is MUST
  elevator_flexible: boolean;
  parking_flexible: boolean;
  balcony_flexible: boolean;
  yard_flexible: boolean;
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
  const greenApiInstance = Deno.env.get('GREEN_API_INSTANCE_ID');
  const greenApiToken = Deno.env.get('GREEN_API_TOKEN');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { property_id, lead_id, send_whatsapp = true, run_id } = await req.json();

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

      // Get all properties that could potentially match (new or matched)
      const { data: properties, error: propError } = await supabase
        .from('scouted_properties')
        .select('*')
        .in('status', ['new', 'matched']);

      if (propError) throw propError;

      let updatedCount = 0;

      for (const property of properties || []) {
        const matchResult = calculateMatch(property, lead);
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

    // Original logic: match new properties to all active leads
    // Get new properties to match
    let query = supabase
      .from('scouted_properties')
      .select('*')
      .eq('status', 'new');

    if (property_id) {
      query = query.eq('id', property_id);
    }

    const { data: properties, error: propError } = await query;

    if (propError) throw propError;

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

    // Get active leads
    const { data: leads, error: leadsError } = await supabase
      .from('contact_leads')
      .select('*')
      .neq('status', 'closed')
      .eq('is_hidden', false);

    if (leadsError) throw leadsError;

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

    for (const property of properties) {
      const matches: MatchResult[] = [];

      for (const lead of leads) {
        const matchResult = calculateMatch(property, lead);
        if (matchResult.matchScore >= 60) { // At least 60% match
          matches.push(matchResult);
        }
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      if (matches.length > 0) {
        totalMatched += matches.length;

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

        // Send WhatsApp to matched leads
        if (send_whatsapp && greenApiInstance && greenApiToken) {
          for (const match of matches.slice(0, 5)) { // Max 5 leads per property
            const message = buildWhatsAppMessage(property, match);
            
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

    // Update run stats if run_id provided
    if (run_id) {
      await supabase
        .from('scout_runs')
        .update({
          leads_matched: totalMatched,
          whatsapp_sent: totalWhatsAppSent
        })
        .eq('id', run_id);
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

// Helper function to calculate allowed price deviation based on price range and type
function getAllowedDeviation(price: number, propertyType: string, direction: 'up' | 'down'): number {
  if (propertyType === 'rent') {
    // Rent deviations
    if (price <= 5000) return direction === 'up' ? 0.20 : 0.30;
    if (price <= 10000) return direction === 'up' ? 0.17 : 0.25;
    return direction === 'up' ? 0.15 : 0.20;
  } else {
    // Sale deviations
    if (price <= 1500000) return direction === 'up' ? 0.15 : 0.25;
    if (price <= 3000000) return direction === 'up' ? 0.12 : 0.20;
    return direction === 'up' ? 0.10 : 0.15;
  }
}

function calculateMatch(property: ScoutedProperty, lead: ContactLead): MatchResult {
  // ===== CRITICAL MUST FILTERS - Lead must have city to get matches =====
  
  // Lead without preferred cities = NO MATCHES
  if (!lead.preferred_cities?.length) {
    return { lead, matchScore: 0, matchReasons: ['לא הוגדרה עיר מועדפת - לא ניתן להתאים'] };
  }
  
  // ===== STRICT FILTERS - No flexibility =====
  
  // Property type MUST match - this is a mandatory filter
  // Handle value differences: scouted uses 'rent'/'sale', leads use 'rental'/'sale'
  const leadPropertyType = lead.property_type;
  const propertyType = property.property_type;
  
  if (leadPropertyType && propertyType) {
    const isRental = propertyType === 'rent' && (leadPropertyType === 'rental' || leadPropertyType === 'rent');
    const isSale = propertyType === 'sale' && leadPropertyType === 'sale';
    
    if (!isRental && !isSale) {
      // Property type doesn't match - return zero score
      return { lead, matchScore: 0, matchReasons: ['סוג עסקה לא מתאים'] };
    }
  }
  
  // City MUST match (we already verified lead has cities above)
  if (property.city) {
    const cityMatch = lead.preferred_cities.some(c => 
      property.city!.includes(c) || c.includes(property.city!)
    );
    if (!cityMatch) {
      return { lead, matchScore: 0, matchReasons: [`עיר לא מתאימה: ${property.city}`] };
    }
  }
  
  // Neighborhood MUST match if lead specified preferences
  if (lead.preferred_neighborhoods?.length) {
    // If property has no neighborhood, it CANNOT match a lead with neighborhood preferences
    if (!property.neighborhood) {
      return { lead, matchScore: 0, matchReasons: ['לנכס אין שכונה מוגדרת - לא ניתן להתאים'] };
    }
    const city = property.city || 'תל אביב יפו';
    const isNeighborhoodMatch = matchNeighborhood(property.neighborhood, lead.preferred_neighborhoods, city);
    if (!isNeighborhoodMatch) {
      return { lead, matchScore: 0, matchReasons: [`שכונה לא מתאימה: ${property.neighborhood}`] };
    }
  }
  
  // ===== MINIMUM ROOMS IS MUST =====
  if (lead.rooms_min && property.rooms) {
    if (property.rooms < lead.rooms_min) {
      return { lead, matchScore: 0, matchReasons: [`נדרש מינימום ${lead.rooms_min} חדרים, בנכס יש ${property.rooms}`] };
    }
  }
  
  // ===== FEATURE MUST FILTERS (when not flexible) =====
  if (property.features) {
    // Elevator - MUST if required and NOT flexible
    if (lead.elevator_required && lead.elevator_flexible === false) {
      if (property.features.elevator === false) {
        return { lead, matchScore: 0, matchReasons: ['נדרשת מעלית - אין בנכס'] };
      }
    }
    
    // Parking - MUST if required and NOT flexible
    if (lead.parking_required && lead.parking_flexible === false) {
      if (property.features.parking === false) {
        return { lead, matchScore: 0, matchReasons: ['נדרשת חניה - אין בנכס'] };
      }
    }
    
    // Balcony - MUST if required and NOT flexible
    if (lead.balcony_required && lead.balcony_flexible === false) {
      if (property.features.balcony === false) {
        return { lead, matchScore: 0, matchReasons: ['נדרשת מרפסת - אין בנכס'] };
      }
    }
    
    // Yard - MUST if required and NOT flexible
    if (lead.yard_required && lead.yard_flexible === false) {
      if (property.features.yard === false) {
        return { lead, matchScore: 0, matchReasons: ['נדרשת חצר - אין בנכס'] };
      }
    }
  }
  
  // ===== FLEXIBLE SCORING - continues below =====
  let score = 0;
  let maxScore = 0;
  const reasons: string[] = [];
  
  // Add property type match to reasons
  if (propertyType === 'rent') {
    reasons.push('דירה להשכרה - מתאים לחיפוש');
  } else if (propertyType === 'sale') {
    reasons.push('דירה למכירה - מתאים לחיפוש');
  }

  // Price match with dynamic flexible ranges (30 points)
  maxScore += 30;
  if (property.price && (lead.budget_min || lead.budget_max)) {
    const minBudget = lead.budget_min || 0;
    const maxBudget = lead.budget_max || Infinity;
    const propType = propertyType || 'rent';
    
    if (property.price >= minBudget && property.price <= maxBudget) {
      // Perfect match - within budget range
      score += 30;
      reasons.push('מחיר בטווח התקציב');
    } else if (property.price < minBudget && minBudget > 0) {
      // Below budget - check if within allowed deviation
      const allowedDown = getAllowedDeviation(minBudget, propType, 'down');
      const minAllowed = minBudget * (1 - allowedDown);
      if (property.price >= minAllowed) {
        score += 25;
        reasons.push('מחיר נמוך מהתקציב');
      }
      // If even below minAllowed, still no penalty - cheaper is good
    } else if (property.price > maxBudget && maxBudget < Infinity) {
      // Above budget - check if within allowed deviation
      const allowedUp = getAllowedDeviation(maxBudget, propType, 'up');
      const maxAllowed = maxBudget * (1 + allowedUp);
      const percentAbove = ((property.price - maxBudget) / maxBudget) * 100;
      
      if (property.price <= maxAllowed) {
        // Within allowed deviation - graduated scoring
        if (percentAbove <= (allowedUp * 100) / 2) {
          score += 20;
          reasons.push(`מחיר מעט מעל התקציב (${Math.round(percentAbove)}%)`);
        } else {
          score += 10;
          reasons.push(`מחיר מעל התקציב (${Math.round(percentAbove)}%)`);
        }
      }
      // Beyond allowed deviation - no points
    }
  }

  // Rooms match (25 points) - minimum is MUST (handled above), only score for max
  maxScore += 25;
  if (property.rooms && (lead.rooms_min || lead.rooms_max)) {
    const minRooms = lead.rooms_min || 0;
    const maxRooms = lead.rooms_max || Infinity;
    
    if (property.rooms >= minRooms && property.rooms <= maxRooms) {
      score += 25;
      reasons.push('מספר חדרים מתאים');
    } else if (property.rooms > maxRooms && property.rooms <= maxRooms + 0.5) {
      // Half room above max is acceptable
      score += 15;
      reasons.push('מספר חדרים קרוב');
    }
    // Below minimum is already filtered as MUST above
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
      // Within 10% of size range
      score += 10;
      reasons.push('גודל קרוב לדרישות');
    }
  }

  // City match (15 points) - already validated as strict filter above
  maxScore += 15;
  if (property.city && lead.preferred_cities?.length) {
    // If we got here, city already matches (passed strict filter)
    score += 15;
    reasons.push('עיר מועדפת');
  }

  // Neighborhood match (10 points) - already validated as strict filter above
  maxScore += 10;
  if (property.neighborhood && lead.preferred_neighborhoods?.length) {
    // If we got here, neighborhood already matches (passed strict filter)
    score += 10;
    reasons.push(`שכונה מועדפת: ${property.neighborhood}`);
  }

  // Features match with penalties (15 points base) - ONLY for flexible features
  maxScore += 15;
  if (property.features) {
    // Elevator check - only if flexible (MUST already handled above)
    if (lead.elevator_required && (lead.elevator_flexible === true || lead.elevator_flexible === undefined)) {
      if (property.features.elevator === true) {
        score += 4;
        reasons.push('יש מעלית ✓');
      } else if (property.features.elevator === false) {
        score -= 6;
        reasons.push('אין מעלית ✗');
      }
    }
    
    // Parking check - only if flexible
    if (lead.parking_required && (lead.parking_flexible === true || lead.parking_flexible === undefined)) {
      if (property.features.parking === true) {
        score += 4;
        reasons.push('יש חניה ✓');
      } else if (property.features.parking === false) {
        score -= 6;
        reasons.push('אין חניה ✗');
      }
    }
    
    // Balcony check - only if flexible
    if (lead.balcony_required && (lead.balcony_flexible === true || lead.balcony_flexible === undefined)) {
      if (property.features.balcony === true) {
        score += 4;
        reasons.push('יש מרפסת ✓');
      } else if (property.features.balcony === false) {
        score -= 3;
        reasons.push('אין מרפסת');
      }
    }
    
    // Yard check - only if flexible
    if (lead.yard_required && (lead.yard_flexible === true || lead.yard_flexible === undefined)) {
      if (property.features.yard === true) {
        score += 4;
        reasons.push('יש חצר ✓');
      } else if (property.features.yard === false) {
        score -= 5;
        reasons.push('אין חצר');
      }
    }
  }

  // Ensure score doesn't go below 0
  const finalScore = Math.max(0, score);
  const matchScore = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;

  return {
    lead,
    matchScore,
    matchReasons: reasons
  };
}

function buildWhatsAppMessage(property: ScoutedProperty, match: MatchResult): string {
  const priceStr = property.price 
    ? `₪${property.price.toLocaleString()}`
    : 'מחיר לא ידוע';
  
  return `שלום ${match.lead.name}! 🏠

מצאתי דירה שיכולה להתאים לך:

📍 ${property.city}${property.neighborhood ? ` - ${property.neighborhood}` : ''}
${property.address ? `🏢 ${property.address}` : ''}
💰 ${priceStr}${property.property_type === 'rent' ? '/חודש' : ''}
🛏️ ${property.rooms} חדרים
📐 ${property.size} מ"ר

${match.matchReasons.slice(0, 3).join('\n')}

לצפייה בנכס: ${property.source_url}

מה אומר/ת?`;
}

function cleanPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 972
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.slice(1);
  }
  
  // If doesn't start with country code, add 972
  if (!cleaned.startsWith('972')) {
    cleaned = '972' + cleaned;
  }
  
  return cleaned;
}
