import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  const greenApiInstance = Deno.env.get('GREEN_API_INSTANCE_ID');
  const greenApiToken = Deno.env.get('GREEN_API_TOKEN');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { property_id, send_whatsapp = true, run_id } = await req.json();

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
            status: 'notified'
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
        // No matches, just mark as notified (processed)
        await supabase
          .from('scouted_properties')
          .update({ status: 'notified', matched_leads: [] })
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

function calculateMatch(property: ScoutedProperty, lead: ContactLead): MatchResult {
  let score = 0;
  let maxScore = 0;
  const reasons: string[] = [];

  // Price match (30 points)
  maxScore += 30;
  if (property.price && (lead.budget_min || lead.budget_max)) {
    const minBudget = lead.budget_min || 0;
    const maxBudget = lead.budget_max || Infinity;
    
    if (property.price >= minBudget && property.price <= maxBudget) {
      score += 30;
      reasons.push('מחיר בטווח התקציב');
    } else if (property.price <= maxBudget * 1.1) {
      score += 15; // Within 10% of max budget
      reasons.push('מחיר קרוב לתקציב');
    }
  }

  // Rooms match (20 points)
  maxScore += 20;
  if (property.rooms && (lead.rooms_min || lead.rooms_max)) {
    const minRooms = lead.rooms_min || 0;
    const maxRooms = lead.rooms_max || Infinity;
    
    if (property.rooms >= minRooms && property.rooms <= maxRooms) {
      score += 20;
      reasons.push('מספר חדרים מתאים');
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
    }
  }

  // City match (20 points)
  maxScore += 20;
  if (property.city && lead.preferred_cities?.length) {
    const cityMatch = lead.preferred_cities.some(c => 
      property.city.includes(c) || c.includes(property.city)
    );
    if (cityMatch) {
      score += 20;
      reasons.push('עיר מועדפת');
    }
  }

  // Neighborhood match (10 points)
  maxScore += 10;
  if (property.neighborhood && lead.preferred_neighborhoods?.length) {
    const neighborhoodMatch = lead.preferred_neighborhoods.some(n => 
      property.neighborhood.includes(n) || n.includes(property.neighborhood)
    );
    if (neighborhoodMatch) {
      score += 10;
      reasons.push('שכונה מועדפת');
    }
  }

  // Features match (5 points total)
  if (property.features) {
    if (lead.elevator_required && property.features.elevator) {
      score += 2;
      reasons.push('יש מעלית');
    }
    if (lead.parking_required && property.features.parking) {
      score += 2;
      reasons.push('יש חניה');
    }
    if (lead.balcony_required && property.features.balcony) {
      score += 1;
      reasons.push('יש מרפסת');
    }
    maxScore += 5;
  }

  const matchScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return {
    lead,
    matchScore,
    matchReasons: reasons
  };
}

function buildWhatsAppMessage(property: ScoutedProperty, match: MatchResult): string {
  const priceStr = property.price 
    ? `₪${property.price.toLocaleString()}` 
    : 'לא צוין';
  
  const roomsStr = property.rooms ? `${property.rooms} חדרים` : '';
  const sizeStr = property.size ? `${property.size} מ"ר` : '';
  const details = [roomsStr, sizeStr].filter(Boolean).join(' | ');

  return `🏠 *נמצאה דירה שמתאימה לך!*

שלום ${match.lead.name},

מצאנו דירה חדשה ב${property.city}${property.neighborhood ? ` - ${property.neighborhood}` : ''}:

📍 *${property.title || property.address || 'דירה חדשה'}*
💰 מחיר: ${priceStr}
${details ? `📐 ${details}` : ''}

✅ *למה זה מתאים לך:*
${match.matchReasons.map(r => `• ${r}`).join('\n')}

🔗 לצפייה במודעה:
${property.source_url}

---
נשמח לעזור לך לתאם ביקור! 📞`;
}

function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1);
  } else if (!cleaned.startsWith('972')) {
    cleaned = '972' + cleaned;
  }
  
  return cleaned;
}
