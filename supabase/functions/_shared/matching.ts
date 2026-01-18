// Shared matching logic for Edge Functions
// This file centralizes the property-to-lead matching algorithm

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
 * Calculate allowed price deviation based on price range and property type
 * @param price - The reference price (budget min/max)
 * @param propertyType - 'rent' or 'sale'
 * @param direction - 'up' for above budget, 'down' for below budget
 * @returns The allowed deviation as a decimal (e.g., 0.20 = 20%)
 */
export function getAllowedDeviation(price: number, propertyType: string, direction: 'up' | 'down'): number {
  if (propertyType === 'rent') {
    // Rent deviations - more flexibility for lower rents
    if (price <= 5000) return direction === 'up' ? 0.20 : 0.30;
    if (price <= 10000) return direction === 'up' ? 0.17 : 0.25;
    return direction === 'up' ? 0.15 : 0.20;
  } else {
    // Sale deviations - tighter for higher prices
    if (price <= 1500000) return direction === 'up' ? 0.15 : 0.25;
    if (price <= 3000000) return direction === 'up' ? 0.12 : 0.20;
    return direction === 'up' ? 0.10 : 0.15;
  }
}

// ===== MAIN MATCHING FUNCTION =====

/**
 * Calculate match score between a scouted property and a contact lead
 * 
 * Scoring breakdown (max 100 points):
 * - Price: 30 points
 * - Rooms: 25 points
 * - City: 15 points (mandatory filter, if we get here it matches)
 * - Size: 15 points
 * - Neighborhood: 10 points (mandatory filter, if we get here it matches)
 * - Features: 15 points (with penalties for missing required features)
 * 
 * Mandatory filters (score = 0 if not matched):
 * - Lead must have preferred cities
 * - Lead must have preferred neighborhoods
 * - Property type must match (rent/sale)
 * - City must match
 * - Neighborhood must match
 * - Minimum rooms requirement
 * - Non-flexible feature requirements (elevator, parking, etc.)
 * 
 * @returns MatchResult with score (0-100) and reasons
 */
export function calculateMatch(property: ScoutedProperty, lead: ContactLead): MatchResult {
  // ===== CRITICAL MUST FILTERS =====
  
  // Lead without preferred cities = NO MATCHES
  if (!lead.preferred_cities?.length) {
    return { lead, matchScore: 0, matchReasons: ['לא הוגדרה עיר מועדפת - לא ניתן להתאים'] };
  }
  
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
  
  // City MUST match - use normalized city names
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
  }
  
  // Lead MUST have preferred neighborhoods to get matches
  if (!lead.preferred_neighborhoods?.length) {
    return { lead, matchScore: 0, matchReasons: ['לא הוגדרו שכונות מועדפות - לא ניתן להתאים'] };
  }

  // Property MUST have neighborhood defined
  if (!property.neighborhood) {
    return { lead, matchScore: 0, matchReasons: ['לנכס אין שכונה מוגדרת - לא ניתן להתאים'] };
  }

  // Neighborhood MUST match
  const city = property.city || 'תל אביב יפו';
  const isNeighborhoodMatch = matchNeighborhood(property.neighborhood, lead.preferred_neighborhoods, city);
  if (!isNeighborhoodMatch) {
    return { lead, matchScore: 0, matchReasons: [`שכונה לא מתאימה: ${property.neighborhood}`] };
  }
  
  // ===== MINIMUM ROOMS IS MUST =====
  if (lead.rooms_min && property.rooms) {
    if (property.rooms < lead.rooms_min) {
      return { lead, matchScore: 0, matchReasons: [`נדרש מינימום ${lead.rooms_min} חדרים, בנכס יש ${property.rooms}`] };
    }
  }
  
  // ===== FEATURE MUST FILTERS (when not flexible) =====
  // IMPORTANT: If a feature is not explicitly true, we assume it's missing.
  // This handles cases where features object is empty {} or the field is undefined.
  
  // Elevator - MUST if required and NOT flexible
  if (lead.elevator_required && lead.elevator_flexible === false) {
    if (property.features?.elevator !== true) {
      return { lead, matchScore: 0, matchReasons: ['נדרשת מעלית - לא צוין שיש בנכס'] };
    }
  }
  
  // Parking - MUST if required and NOT flexible
  if (lead.parking_required && lead.parking_flexible === false) {
    if (property.features?.parking !== true) {
      return { lead, matchScore: 0, matchReasons: ['נדרשת חניה - לא צוין שיש בנכס'] };
    }
  }
  
  // Outdoor space features - OR mode vs AND mode
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
    }
  } else {
    // AND mode: each feature is checked individually
    if (lead.balcony_required && lead.balcony_flexible === false) {
      if (property.features?.balcony !== true) {
        return { lead, matchScore: 0, matchReasons: ['נדרשת מרפסת - לא צוין שיש בנכס'] };
      }
    }
    
    if (lead.yard_required && lead.yard_flexible === false) {
      if (property.features?.yard !== true) {
        return { lead, matchScore: 0, matchReasons: ['נדרשת חצר - לא צוין שיש בנכס'] };
      }
    }
    
    if (lead.roof_required && lead.roof_flexible === false) {
      if (property.features?.roof !== true) {
        return { lead, matchScore: 0, matchReasons: ['נדרש גג - לא צוין שיש בנכס'] };
      }
    }
  }
  
  // Pets - check if lead needs pets and property allows them
  if (lead.pets === true && lead.pets_flexible === false) {
    if (property.features?.pets !== true && property.features?.allows_pets !== true) {
      return { lead, matchScore: 0, matchReasons: ['נדרש לאפשר חיות מחמד - לא מותר בנכס'] };
    }
  }
  
  // ===== FLEXIBLE SCORING =====
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
    const maxBudget = lead.budget_max || Infinity;
    const propType = propertyType || 'rent';
    
    // Calculate automatic minimum budget if not explicitly set
    let minBudget = lead.budget_min;
    if (!minBudget && lead.budget_max) {
      const allowedDown = getAllowedDeviation(lead.budget_max, propType, 'down');
      minBudget = Math.floor(lead.budget_max * (1 - allowedDown));
    } else if (!minBudget) {
      minBudget = 0;
    }
    
    if (property.price >= minBudget && property.price <= maxBudget) {
      score += 30;
      reasons.push('מחיר בטווח התקציב');
    } else if (property.price < minBudget && minBudget > 0) {
      const allowedDown = getAllowedDeviation(minBudget, propType, 'down');
      const minAllowed = minBudget * (1 - allowedDown);
      if (property.price >= minAllowed) {
        score += 25;
        reasons.push('מחיר נמוך מהתקציב');
      } else {
        score += 15;
        reasons.push('מחיר נמוך משמעותית מהתקציב');
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
    } else if (property.rooms > maxRooms && property.rooms <= maxRooms + 0.5) {
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

  // City match (15 points) - already validated as strict filter above
  maxScore += 15;
  if (property.city && lead.preferred_cities?.length) {
    score += 15;
    reasons.push('עיר מועדפת');
  }

  // Neighborhood match (10 points) - already validated as strict filter above
  maxScore += 10;
  if (property.neighborhood && lead.preferred_neighborhoods?.length) {
    score += 10;
    reasons.push(`שכונה מועדפת: ${property.neighborhood}`);
  }

  // Features match with penalties (15 points base)
  maxScore += 15;
  if (property.features) {
    // Elevator check - only if flexible
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
    
    // Outdoor space features - OR mode vs AND mode
    if (lead.outdoor_space_any) {
      const outdoorOptions: { key: string; label: string }[] = [];
      if (lead.balcony_required) outdoorOptions.push({ key: 'balcony', label: 'מרפסת' });
      if (lead.yard_required) outdoorOptions.push({ key: 'yard', label: 'חצר' });
      if (lead.roof_required) outdoorOptions.push({ key: 'roof', label: 'גג' });
      
      if (outdoorOptions.length > 0) {
        const matchingOutdoor = outdoorOptions.filter(opt => 
          property.features[opt.key] === true
        );
        
        if (matchingOutdoor.length > 0) {
          score += 5;
          reasons.push(`יש ${matchingOutdoor.map(o => o.label).join(' / ')} ✓`);
        } else {
          score -= 5;
          reasons.push(`אין שטח חיצוני (${outdoorOptions.map(o => o.label).join('/')}) ✗`);
        }
      }
    } else {
      // AND mode: each feature is checked individually
      if (lead.balcony_required && (lead.balcony_flexible === true || lead.balcony_flexible === undefined)) {
        if (property.features.balcony === true) {
          score += 4;
          reasons.push('יש מרפסת ✓');
        } else if (property.features.balcony === false) {
          score -= 3;
          reasons.push('אין מרפסת');
        }
      }
      
      if (lead.yard_required && (lead.yard_flexible === true || lead.yard_flexible === undefined)) {
        if (property.features.yard === true) {
          score += 4;
          reasons.push('יש חצר ✓');
        } else if (property.features.yard === false) {
          score -= 5;
          reasons.push('אין חצר');
        }
      }
      
      if (lead.roof_required && (lead.roof_flexible === true || lead.roof_flexible === undefined)) {
        if (property.features.roof === true) {
          score += 4;
          reasons.push('יש גג ✓');
        } else if (property.features.roof === false) {
          score -= 4;
          reasons.push('אין גג');
        }
      }
    }
    
    // Pets check - only if flexible
    if (lead.pets === true && (lead.pets_flexible === true || lead.pets_flexible === undefined)) {
      if (property.features.pets === true || property.features.allows_pets === true) {
        score += 3;
        reasons.push('מאפשר חיות מחמד ✓');
      } else if (property.features.pets === false || property.features.allows_pets === false) {
        score -= 5;
        reasons.push('לא מאפשר חיות מחמד');
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

${match.matchReasons.slice(0, 3).join('\n')}

לצפייה בנכס: ${property.source_url}

מה אומר/ת?`;
}

/**
 * Clean and format phone number for WhatsApp
 */
export function cleanPhoneNumber(phone: string): string {
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
