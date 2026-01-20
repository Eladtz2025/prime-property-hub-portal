// Shared matching logic for Edge Functions
// SIMPLIFIED: Binary match/no-match with dynamic price flexibility

import { matchNeighborhood } from "./locations.ts";

// ===== INTERFACES =====

export interface ScoutedProperty {
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

export interface ContactLead {
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
  roof_required: boolean;
  pets: boolean;
  pets_flexible: boolean;
  elevator_flexible: boolean;
  parking_flexible: boolean;
  balcony_flexible: boolean;
  yard_flexible: boolean;
  roof_flexible: boolean;
  outdoor_space_any: boolean;
  move_in_date: string | null;
  flexible_move_date: boolean;
}

export interface MatchResult {
  lead: ContactLead;
  matchScore: number;
  matchReasons: string[];
}

// ===== HELPER FUNCTIONS =====

/**
 * Normalize city names to a canonical form for consistent matching
 */
export function normalizeCityName(city: string): string {
  if (!city) return city;
  const normalized = city.toLowerCase().trim().replace(/[-\s]/g, '');
  
  // Handle all Tel Aviv variations - English and Hebrew
  const telAvivVariations = ['תלאביב', 'תלאביביפו', 'telaviv', 'telavivyafo', 'tlv', 'תא', 'tel-aviv'];
  if (telAvivVariations.some(v => normalized === v || normalized.includes(v)) || 
      (normalized.includes('תל') && normalized.includes('אביב')) ||
      (normalized.includes('tel') && normalized.includes('aviv'))) {
    return 'תל אביב יפו';
  }
  return city.trim();
}

/**
 * Get dynamic price flexibility based on price range and property type
 * For rentals:
 * - Up to ₪7,000: 15%
 * - ₪7,001 - ₪15,000: 10%
 * - Above ₪15,000: 8%
 */
export function getPriceFlexibility(price: number, propertyType: string): number {
  if (propertyType === 'rent' || propertyType === 'rental') {
    if (price <= 7000) return 0.15;      // 15%
    if (price <= 15000) return 0.10;     // 10%
    return 0.08;                         // 8%
  }
  // Sale - tighter flexibility for higher prices
  if (price <= 1500000) return 0.12;     // 12%
  if (price <= 3000000) return 0.10;     // 10%
  return 0.08;                           // 8%
}

// ===== MAIN MATCHING FUNCTION =====

/**
 * Calculate match between a scouted property and a contact lead
 * 
 * SIMPLIFIED BINARY LOGIC:
 * - City: MUST match (mandatory)
 * - Neighborhood: MUST match (mandatory)
 * - Price: MUST be within range (with dynamic flexibility)
 * - Rooms: MUST be within min/max (including halves)
 * - Features: MUST match if required AND not flexible
 * 
 * If all conditions pass: matchScore = 100
 * If any condition fails: matchScore = 0
 * 
 * @returns MatchResult with score (0 or 100) and reasons
 */
export function calculateMatch(property: ScoutedProperty, lead: ContactLead): MatchResult {
  const reasons: string[] = [];
  
  // ===== MANDATORY: Lead must have preferred cities =====
  if (!lead.preferred_cities?.length) {
    return { lead, matchScore: 0, matchReasons: ['לא הוגדרה עיר מועדפת - לא ניתן להתאים'] };
  }
  
  // ===== MANDATORY: Lead must have preferred neighborhoods =====
  if (!lead.preferred_neighborhoods?.length) {
    return { lead, matchScore: 0, matchReasons: ['לא הוגדרו שכונות מועדפות - לא ניתן להתאים'] };
  }
  
  // ===== PROPERTY TYPE MUST MATCH =====
  const leadPropertyType = lead.property_type;
  const propertyType = property.property_type;
  
  if (leadPropertyType && propertyType) {
    const isRental = propertyType === 'rent' && (leadPropertyType === 'rental' || leadPropertyType === 'rent');
    const isSale = propertyType === 'sale' && leadPropertyType === 'sale';
    
    if (!isRental && !isSale) {
      return { lead, matchScore: 0, matchReasons: ['סוג עסקה לא מתאים'] };
    }
  }
  
  // Add property type to reasons
  if (propertyType === 'rent') {
    reasons.push('דירה להשכרה ✓');
  } else if (propertyType === 'sale') {
    reasons.push('דירה למכירה ✓');
  }
  
  // ===== CITY MUST MATCH =====
  if (property.city) {
    const normalizedPropertyCity = normalizeCityName(property.city);
    const cityMatch = lead.preferred_cities.some(c => {
      const normalizedLeadCity = normalizeCityName(c);
      return normalizedPropertyCity === normalizedLeadCity ||
             normalizedPropertyCity.includes(normalizedLeadCity) ||
             normalizedLeadCity.includes(normalizedPropertyCity);
    });
    if (!cityMatch) {
      return { lead, matchScore: 0, matchReasons: [`עיר לא מתאימה: ${property.city}`] };
    }
    reasons.push('עיר מועדפת ✓');
  }
  
  // ===== NEIGHBORHOOD MUST MATCH =====
  if (!property.neighborhood) {
    return { lead, matchScore: 0, matchReasons: ['לנכס אין שכונה מוגדרת - לא ניתן להתאים'] };
  }
  
  const city = property.city || 'תל אביב יפו';
  const isNeighborhoodMatch = matchNeighborhood(property.neighborhood, lead.preferred_neighborhoods, city);
  if (!isNeighborhoodMatch) {
    return { lead, matchScore: 0, matchReasons: [`שכונה לא מתאימה: ${property.neighborhood}`] };
  }
  reasons.push(`שכונה מועדפת: ${property.neighborhood} ✓`);
  
  // ===== PRICE MUST BE IN RANGE (with dynamic flexibility) =====
  if (property.price && lead.budget_max) {
    const propType = propertyType || 'rent';
    const flexibility = getPriceFlexibility(lead.budget_max, propType);
    
    // Calculate allowed range
    const minBudget = lead.budget_min || 0;
    const maxAllowed = lead.budget_max * (1 + flexibility);
    
    if (property.price < minBudget) {
      return { lead, matchScore: 0, matchReasons: [`מחיר נמוך מהתקציב המינימלי: ₪${property.price.toLocaleString()}`] };
    }
    
    if (property.price > maxAllowed) {
      const percentAbove = Math.round(((property.price - lead.budget_max) / lead.budget_max) * 100);
      return { lead, matchScore: 0, matchReasons: [`מחיר גבוה מהתקציב ב-${percentAbove}%: ₪${property.price.toLocaleString()}`] };
    }
    
    // Determine price position for reason text
    if (property.price <= lead.budget_max) {
      if (property.price < lead.budget_max * 0.9) {
        reasons.push('מחיר נמוך מהתקציב ✓');
      } else {
        reasons.push('מחיר בטווח התקציב ✓');
      }
    } else {
      const percentAbove = Math.round(((property.price - lead.budget_max) / lead.budget_max) * 100);
      reasons.push(`מחיר מעט מעל התקציב (+${percentAbove}%) ✓`);
    }
  }
  
  // ===== ROOMS MUST BE IN RANGE =====
  if (property.rooms) {
    if (lead.rooms_min && property.rooms < lead.rooms_min) {
      return { lead, matchScore: 0, matchReasons: [`נדרש מינימום ${lead.rooms_min} חדרים, בנכס יש ${property.rooms}`] };
    }
    if (lead.rooms_max && property.rooms > lead.rooms_max) {
      return { lead, matchScore: 0, matchReasons: [`נדרש מקסימום ${lead.rooms_max} חדרים, בנכס יש ${property.rooms}`] };
    }
    reasons.push(`${property.rooms} חדרים ✓`);
  }
  
  // ===== FEATURE CHECKS (only if required AND not flexible) =====
  
  // Elevator
  if (lead.elevator_required && lead.elevator_flexible === false) {
    if (property.features?.elevator !== true) {
      return { lead, matchScore: 0, matchReasons: ['נדרשת מעלית - לא צוין שיש בנכס'] };
    }
    reasons.push('יש מעלית ✓');
  } else if (lead.elevator_required && property.features?.elevator === true) {
    reasons.push('יש מעלית ✓');
  }
  
  // Parking
  if (lead.parking_required && lead.parking_flexible === false) {
    if (property.features?.parking !== true) {
      return { lead, matchScore: 0, matchReasons: ['נדרשת חניה - לא צוין שיש בנכס'] };
    }
    reasons.push('יש חניה ✓');
  } else if (lead.parking_required && property.features?.parking === true) {
    reasons.push('יש חניה ✓');
  }
  
  // Outdoor space - OR mode vs AND mode
  if (lead.outdoor_space_any) {
    // OR mode: at least one of the selected outdoor features MUST exist
    const outdoorOptions: string[] = [];
    if (lead.balcony_required) outdoorOptions.push('balcony');
    if (lead.yard_required) outdoorOptions.push('yard');
    if (lead.roof_required) outdoorOptions.push('roof');
    
    if (outdoorOptions.length > 0) {
      const hasAnyOutdoor = outdoorOptions.some(opt => 
        property.features?.[opt] === true
      );
      
      if (!hasAnyOutdoor) {
        const optionsText = outdoorOptions.map(opt => {
          if (opt === 'balcony') return 'מרפסת';
          if (opt === 'yard') return 'חצר';
          if (opt === 'roof') return 'גג';
          return opt;
        }).join(' או ');
        return { lead, matchScore: 0, matchReasons: [`נדרש ${optionsText} - לא צוין שיש בנכס`] };
      }
      
      // Add what was found
      const foundOutdoor = outdoorOptions.filter(opt => property.features?.[opt] === true);
      const foundText = foundOutdoor.map(opt => {
        if (opt === 'balcony') return 'מרפסת';
        if (opt === 'yard') return 'חצר';
        if (opt === 'roof') return 'גג';
        return opt;
      }).join(' / ');
      reasons.push(`יש ${foundText} ✓`);
    }
  } else {
    // AND mode: each feature is checked individually
    if (lead.balcony_required && lead.balcony_flexible === false) {
      if (property.features?.balcony !== true) {
        return { lead, matchScore: 0, matchReasons: ['נדרשת מרפסת - לא צוין שיש בנכס'] };
      }
      reasons.push('יש מרפסת ✓');
    } else if (lead.balcony_required && property.features?.balcony === true) {
      reasons.push('יש מרפסת ✓');
    }
    
    if (lead.yard_required && lead.yard_flexible === false) {
      if (property.features?.yard !== true) {
        return { lead, matchScore: 0, matchReasons: ['נדרשת חצר - לא צוין שיש בנכס'] };
      }
      reasons.push('יש חצר ✓');
    } else if (lead.yard_required && property.features?.yard === true) {
      reasons.push('יש חצר ✓');
    }
    
    if (lead.roof_required && lead.roof_flexible === false) {
      if (property.features?.roof !== true) {
        return { lead, matchScore: 0, matchReasons: ['נדרש גג - לא צוין שיש בנכס'] };
      }
      reasons.push('יש גג ✓');
    } else if (lead.roof_required && property.features?.roof === true) {
      reasons.push('יש גג ✓');
    }
  }
  
  // Pets
  if (lead.pets === true && lead.pets_flexible === false) {
    if (property.features?.pets !== true && property.features?.allows_pets !== true) {
      return { lead, matchScore: 0, matchReasons: ['נדרש לאפשר חיות מחמד - לא מותר בנכס'] };
    }
    reasons.push('מאפשר חיות מחמד ✓');
  } else if (lead.pets === true && (property.features?.pets === true || property.features?.allows_pets === true)) {
    reasons.push('מאפשר חיות מחמד ✓');
  }
  
  // ===== ALL CHECKS PASSED - MATCH! =====
  return {
    lead,
    matchScore: 100,
    matchReasons: reasons
  };
}

// ===== WHATSAPP HELPERS =====

/**
 * Build a WhatsApp message for a matched property
 */
export function buildWhatsAppMessage(property: ScoutedProperty, match: MatchResult): string {
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

${match.matchReasons.slice(0, 5).join('\n')}

לצפייה בנכס: ${property.source_url}

מה אומר/ת?`;
}

/**
 * Clean and format phone number for WhatsApp
 */
export function cleanPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Israeli numbers
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1);
  }
  
  // Ensure it starts with country code
  if (!cleaned.startsWith('972')) {
    cleaned = '972' + cleaned;
  }
  
  return cleaned;
}
