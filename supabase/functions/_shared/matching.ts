// Shared matching logic for Edge Functions
// SIMPLIFIED: Binary match/no-match with dynamic price flexibility

import { matchNeighborhood, extractStreetName, extractHouseNumber } from "./locations.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  immediate_entry: boolean;
  flexible_move_date: boolean;
  // New fields
  mamad_required: boolean;
  mamad_flexible: boolean;
  furnished_required: string | null; // 'fully_furnished' | 'partially_furnished'
  furnished_flexible: boolean;
}

export interface MatchResult {
  lead: ContactLead;
  matchScore: number;
  matchReasons: string[];
  priority: number; // 0-100, higher = better match quality
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
 * Now accepts configurable thresholds
 */
export function getPriceFlexibility(
  price: number, 
  propertyType: string,
  flexSettings?: {
    rent_flex_low_threshold?: number;
    rent_flex_low_percent?: number;
    rent_flex_mid_threshold?: number;
    rent_flex_mid_percent?: number;
    rent_flex_high_percent?: number;
  }
): number {
  const s = {
    rent_flex_low_threshold: flexSettings?.rent_flex_low_threshold ?? 7000,
    rent_flex_low_percent: flexSettings?.rent_flex_low_percent ?? 0.15,
    rent_flex_mid_threshold: flexSettings?.rent_flex_mid_threshold ?? 15000,
    rent_flex_mid_percent: flexSettings?.rent_flex_mid_percent ?? 0.10,
    rent_flex_high_percent: flexSettings?.rent_flex_high_percent ?? 0.08,
  };

  if (propertyType === 'rent' || propertyType === 'rental') {
    if (price <= s.rent_flex_low_threshold) return s.rent_flex_low_percent;
    if (price <= s.rent_flex_mid_threshold) return s.rent_flex_mid_percent;
    return s.rent_flex_high_percent;
  }
  // Sale - tighter flexibility for higher prices
  if (price <= 1500000) return 0.12;     // 12%
  if (price <= 3000000) return 0.10;     // 10%
  return 0.08;                           // 8%
}

// ===== MATCHING SETTINGS INTERFACE =====

export interface MatchingSettings {
  entry_date_range_strict: number;
  entry_date_range_flexible: number;
  immediate_max_days: number;
  // Price flexibility settings
  rent_flex_low_threshold?: number;
  rent_flex_low_percent?: number;
  rent_flex_mid_threshold?: number;
  rent_flex_mid_percent?: number;
  rent_flex_high_percent?: number;
}

// Default matching settings (used when not provided)
export const defaultMatchingSettings: MatchingSettings = {
  entry_date_range_strict: 10,
  entry_date_range_flexible: 14,
  immediate_max_days: 30,
  rent_flex_low_threshold: 7000,
  rent_flex_low_percent: 0.15,
  rent_flex_mid_threshold: 15000,
  rent_flex_mid_percent: 0.10,
  rent_flex_high_percent: 0.08,
};

// ===== MAIN MATCHING FUNCTION =====

/**
 * Calculate match between a scouted property and a contact lead
 * 
 * NOTE: Lead eligibility (cities, neighborhoods, budget, rooms) is now checked
 * by a database trigger. This function assumes the lead is already eligible.
 * 
 * BINARY MATCHING LOGIC:
 * - Property Type: MUST match (rent/sale)
 * - City: MUST match (mandatory)
 * - Neighborhood: MUST match (mandatory) - will lookup by street if missing
 * - Price: MUST be within range (with dynamic flexibility)
 * - Rooms: MUST be within min/max (including halves)
 * - Features: MUST match if required AND not flexible
 * - Entry Date: MUST match if specified (rentals only)
 * 
 * If all conditions pass: matchScore = 100
 * If any condition fails: matchScore = 0
 * 
 * @returns MatchResult with score (0 or 100) and reasons
 */
export async function calculateMatch(
  property: ScoutedProperty, 
  lead: ContactLead,
  settings: MatchingSettings = defaultMatchingSettings
): Promise<MatchResult> {
  const reasons: string[] = [];
  
  // NOTE: Lead eligibility checks (cities, neighborhoods, budget, rooms) have been 
  // moved to a database trigger (update_lead_eligibility). match-batch now filters
  // by matching_status = 'eligible' before calling this function.
  
  // ===== ADDRESS MUST BE A VALID STREET (not just neighborhood name) =====
  const address = property.address?.trim();
  const neighborhood = property.neighborhood?.trim();
  
  // Skip properties without a real street address
  if (!address || address === '') {
    return { lead, matchScore: 0, matchReasons: ['לנכס אין כתובת'], priority: 0 };
  }
  
  // Skip generic "apartment" addresses
  if (address.toLowerCase() === 'דירה' || address.toLowerCase() === 'apartment') {
    return { lead, matchScore: 0, matchReasons: ['כתובת לא ספציפית'], priority: 0 };
  }
  
  // Skip if address is just the neighborhood name (no real street)
  if (neighborhood && address.toLowerCase() === neighborhood.toLowerCase()) {
    return { lead, matchScore: 0, matchReasons: ['כתובת היא רק שם שכונה'], priority: 0 };
  }
  
  // ===== PROPERTY TYPE MUST MATCH =====
  const leadPropertyType = lead.property_type;
  const propertyType = property.property_type;
  
  if (leadPropertyType && propertyType) {
    const isRental = propertyType === 'rent' && (leadPropertyType === 'rental' || leadPropertyType === 'rent');
    const isSale = propertyType === 'sale' && leadPropertyType === 'sale';
    
    if (!isRental && !isSale) {
      return { lead, matchScore: 0, matchReasons: ['סוג עסקה לא מתאים'], priority: 0 };
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
      return { lead, matchScore: 0, matchReasons: [`עיר לא מתאימה: ${property.city}`], priority: 0 };
    }
    reasons.push('עיר מועדפת ✓');
  }
  
  // ===== NEIGHBORHOOD MUST MATCH (with street lookup fallback) =====
  const city = property.city || 'תל אביב יפו';
  let neighborhoodToMatch = property.neighborhood;
  let neighborhoodSource = 'property';
  
  // If property has no neighborhood but has address, try to find it from street_neighborhoods table
  if (!neighborhoodToMatch && property.address) {
    const streetName = extractStreetName(property.address);
    const houseNumber = extractHouseNumber(property.address);
    
    if (streetName) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // First try to find by street name AND house number in range
        if (houseNumber) {
          const { data: rangeData } = await supabase
            .from('street_neighborhoods')
            .select('neighborhood, confidence')
            .eq('street_name', streetName)
            .eq('city', city)
            .lte('number_from', houseNumber)
            .gte('number_to', houseNumber)
            .order('confidence', { ascending: false })
            .limit(1)
            .single();
          
          if (rangeData?.neighborhood) {
            neighborhoodToMatch = rangeData.neighborhood;
            neighborhoodSource = 'street_range';
          }
        }
        
        // Fallback: find by street name only (most common neighborhood)
        if (!neighborhoodToMatch) {
          const { data: streetData } = await supabase
            .from('street_neighborhoods')
            .select('neighborhood')
            .eq('street_name', streetName)
            .eq('city', city)
            .order('confidence', { ascending: false })
            .limit(1)
            .single();
          
          if (streetData?.neighborhood) {
            neighborhoodToMatch = streetData.neighborhood;
            neighborhoodSource = 'street_lookup';
          }
        }
      } catch (error) {
        console.log(`Street lookup failed for ${streetName}: ${error}`);
      }
    }
  }
  
  if (!neighborhoodToMatch) {
    return { lead, matchScore: 0, matchReasons: ['לנכס אין שכונה מוגדרת - לא ניתן להתאים'], priority: 0 };
  }
  
  const isNeighborhoodMatch = matchNeighborhood(neighborhoodToMatch, lead.preferred_neighborhoods, city);
  if (!isNeighborhoodMatch) {
    const source = neighborhoodSource === 'street_range' ? ' (לפי כתובת)' : 
                   neighborhoodSource === 'street_lookup' ? ' (לפי רחוב)' : '';
    return { lead, matchScore: 0, matchReasons: [`שכונה לא מתאימה: ${neighborhoodToMatch}${source}`], priority: 0 };
  }
  const neighborhoodNote = neighborhoodSource === 'street_range' ? ' (לפי כתובת)' : 
                            neighborhoodSource === 'street_lookup' ? ' (לפי רחוב)' : '';
  reasons.push(`שכונה מועדפת: ${neighborhoodToMatch}${neighborhoodNote} ✓`);
  
  // ===== PRICE MUST BE IN RANGE (with dynamic flexibility) =====
  if (property.price && lead.budget_max) {
    const propType = propertyType || 'rent';
    const flexibility = getPriceFlexibility(lead.budget_max, propType, settings);
    
    // Calculate allowed range with symmetric flexibility
    const minBudget = lead.budget_min || 0;
    const minAllowed = minBudget > 0 ? minBudget * (1 - flexibility) : 0;  // גמישות למטה
    const maxAllowed = lead.budget_max * (1 + flexibility);  // גמישות למעלה
    
    if (property.price < minAllowed) {
      const percentBelow = Math.round(((minBudget - property.price) / minBudget) * 100);
      return { lead, matchScore: 0, matchReasons: [`מחיר נמוך מהתקציב המינימלי ב-${percentBelow}%: ₪${property.price.toLocaleString()}`], priority: 0 };
    }
    
    if (property.price > maxAllowed) {
      const percentAbove = Math.round(((property.price - lead.budget_max) / lead.budget_max) * 100);
      return { lead, matchScore: 0, matchReasons: [`מחיר גבוה מהתקציב ב-${percentAbove}%: ₪${property.price.toLocaleString()}`], priority: 0 };
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
      return { lead, matchScore: 0, matchReasons: [`נדרש מינימום ${lead.rooms_min} חדרים, בנכס יש ${property.rooms}`], priority: 0 };
    }
    if (lead.rooms_max && property.rooms > lead.rooms_max) {
      return { lead, matchScore: 0, matchReasons: [`נדרש מקסימום ${lead.rooms_max} חדרים, בנכס יש ${property.rooms}`], priority: 0 };
    }
    reasons.push(`${property.rooms} חדרים ✓`);
  }
  
  // ===== FEATURE CHECKS (only if required AND not flexible) =====
  
  // Elevator
  if (lead.elevator_required && lead.elevator_flexible === false) {
    if (property.features?.elevator !== true) {
      return { lead, matchScore: 0, matchReasons: ['נדרשת מעלית - לא צוין שיש בנכס'], priority: 0 };
    }
    reasons.push('יש מעלית (חובה) ✓');
  } else if (lead.elevator_required && property.features?.elevator === true) {
    reasons.push('יש מעלית ✓');
  }
  
  // Parking
  if (lead.parking_required && lead.parking_flexible === false) {
    if (property.features?.parking !== true) {
      return { lead, matchScore: 0, matchReasons: ['נדרשת חניה - לא צוין שיש בנכס'], priority: 0 };
    }
    reasons.push('יש חניה (חובה) ✓');
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
        return { lead, matchScore: 0, matchReasons: [`נדרש ${optionsText} - לא צוין שיש בנכס`], priority: 0 };
      }
      
      // Add what was found - mark as required since outdoor_space_any is a must-have
      const foundOutdoor = outdoorOptions.filter(opt => property.features?.[opt] === true);
      const foundText = foundOutdoor.map(opt => {
        if (opt === 'balcony') return 'מרפסת';
        if (opt === 'yard') return 'חצר';
        if (opt === 'roof') return 'גג';
        return opt;
      }).join(' / ');
      reasons.push(`יש ${foundText} (חובה) ✓`);
    }
  } else {
    // AND mode: each feature is checked individually
    if (lead.balcony_required && lead.balcony_flexible === false) {
      if (property.features?.balcony !== true) {
        return { lead, matchScore: 0, matchReasons: ['נדרשת מרפסת - לא צוין שיש בנכס'], priority: 0 };
      }
      reasons.push('יש מרפסת (חובה) ✓');
    } else if (lead.balcony_required && property.features?.balcony === true) {
      reasons.push('יש מרפסת ✓');
    }
    
    if (lead.yard_required && lead.yard_flexible === false) {
      if (property.features?.yard !== true) {
        return { lead, matchScore: 0, matchReasons: ['נדרשת חצר - לא צוין שיש בנכס'], priority: 0 };
      }
      reasons.push('יש חצר (חובה) ✓');
    } else if (lead.yard_required && property.features?.yard === true) {
      reasons.push('יש חצר ✓');
    }
    
    if (lead.roof_required && lead.roof_flexible === false) {
      if (property.features?.roof !== true) {
        return { lead, matchScore: 0, matchReasons: ['נדרש גג - לא צוין שיש בנכס'], priority: 0 };
      }
      reasons.push('יש גג (חובה) ✓');
    } else if (lead.roof_required && property.features?.roof === true) {
      reasons.push('יש גג ✓');
    }
  }
  
  // Pets
  if (lead.pets === true && lead.pets_flexible === false) {
    if (property.features?.pets !== true && property.features?.allows_pets !== true) {
      return { lead, matchScore: 0, matchReasons: ['נדרש לאפשר חיות מחמד - לא מותר בנכס'], priority: 0 };
    }
    reasons.push('מאפשר חיות מחמד (חובה) ✓');
  } else if (lead.pets === true && (property.features?.pets === true || property.features?.allows_pets === true)) {
    reasons.push('מאפשר חיות מחמד ✓');
  }
  
  // ===== NEW: Mamad (Safe Room) =====
  if (lead.mamad_required && lead.mamad_flexible === false) {
    if (property.features?.mamad !== true) {
      return { lead, matchScore: 0, matchReasons: ['נדרש ממ"ד - לא צוין שיש בנכס'], priority: 0 };
    }
    reasons.push('יש ממ"ד (חובה) ✓');
  } else if (lead.mamad_required && property.features?.mamad === true) {
    reasons.push('יש ממ"ד ✓');
  }
  
  // ===== NEW: Furnished =====
  if (lead.furnished_required && lead.furnished_flexible === false) {
    const propertyFurnished = property.features?.furnished;
    
    if (lead.furnished_required === 'fully_furnished') {
      if (propertyFurnished !== 'fully_furnished') {
        return { lead, matchScore: 0, matchReasons: ['נדרשת דירה מרוהטת מלא - לא צוין בנכס'], priority: 0 };
      }
      reasons.push('מרוהטת מלא (חובה) ✓');
    } else if (lead.furnished_required === 'partially_furnished') {
      // Accept fully or partially furnished
      if (propertyFurnished !== 'fully_furnished' && propertyFurnished !== 'partially_furnished') {
        return { lead, matchScore: 0, matchReasons: ['נדרשת דירה מרוהטת לפחות חלקית - לא צוין בנכס'], priority: 0 };
      }
      reasons.push('מרוהטת (חובה) ✓');
    }
  } else if (lead.furnished_required && property.features?.furnished) {
    const furnishedLabel = property.features.furnished === 'fully_furnished' ? 'מרוהטת מלא' : 'מרוהטת חלקית';
    reasons.push(`${furnishedLabel} ✓`);
  }
  
  // ===== ENTRY DATE MATCHING (RENTALS ONLY) =====
  if (property.property_type !== 'sale') {
    const propertyEntryDate = property.features?.entry_date 
      ? new Date(property.features.entry_date) 
      : null;
    // Use explicit immediate_entry flag instead of assuming null date = immediate
    const propertyIsImmediate = property.features?.immediate_entry === true;
    // Property has no date info if neither entry_date nor immediate_entry is set
    const propertyHasNoDateInfo = !propertyEntryDate && !propertyIsImmediate;
    
    const today = new Date();
    const maxDaysForImmediate = new Date();
    maxDaysForImmediate.setDate(maxDaysForImmediate.getDate() + settings.immediate_max_days);

    // Case 1: Lead requires IMMEDIATE entry
    if (lead.immediate_entry === true) {
      if (propertyIsImmediate) {
        reasons.push('כניסה מיידית ✓');
      } else if (propertyEntryDate && propertyEntryDate <= maxDaysForImmediate) {
        reasons.push(`כניסה תוך ${settings.immediate_max_days} יום ✓`);
      } else if (propertyHasNoDateInfo) {
        // Property has no date info - include with note (don't reject potential matches)
        reasons.push('תאריך כניסה לא ידוע');
      } else {
        return { lead, matchScore: 0, matchReasons: ['הנכס לא פנוי מיידית'], priority: 0 };
      }
    }
    
    // Case 2: Lead has specific date (±strict range days)
    else if (lead.move_in_date && lead.flexible_move_date !== true) {
      if (propertyHasNoDateInfo) {
        // Property has no date info - include with note (don't reject potential matches)
        reasons.push('תאריך כניסה לא ידוע');
      } else if (propertyIsImmediate) {
        // Immediate properties don't match specific dates
        return { lead, matchScore: 0, matchReasons: ['נדרש תאריך ספציפי - הנכס מיידי'], priority: 0 };
      } else if (propertyEntryDate) {
        const requestedDate = new Date(lead.move_in_date);
        const daysBefore = new Date(requestedDate);
        daysBefore.setDate(daysBefore.getDate() - settings.entry_date_range_strict);
        const daysAfter = new Date(requestedDate);
        daysAfter.setDate(daysAfter.getDate() + settings.entry_date_range_strict);
        
        if (propertyEntryDate < daysBefore || propertyEntryDate > daysAfter) {
          return { lead, matchScore: 0, matchReasons: [`תאריך כניסה לא בטווח (±${settings.entry_date_range_strict} ימים)`], priority: 0 };
        }
        reasons.push('תאריך כניסה תואם ✓');
      }
    }
    
    // Case 3: Lead has specific date + FLEXIBLE (±flexible range days)
    else if (lead.move_in_date && lead.flexible_move_date === true) {
      if (propertyHasNoDateInfo) {
        // Property has no date info - include with note (don't reject potential matches)
        reasons.push('תאריך כניסה לא ידוע');
      } else if (propertyIsImmediate) {
        // Immediate properties don't match specific dates
        return { lead, matchScore: 0, matchReasons: ['נדרש תאריך ספציפי - הנכס מיידי'], priority: 0 };
      } else if (propertyEntryDate) {
        const requestedDate = new Date(lead.move_in_date);
        const flexDaysBefore = new Date(requestedDate);
        flexDaysBefore.setDate(flexDaysBefore.getDate() - settings.entry_date_range_flexible);
        const flexDaysAfter = new Date(requestedDate);
        flexDaysAfter.setDate(flexDaysAfter.getDate() + settings.entry_date_range_flexible);
        
        if (propertyEntryDate < flexDaysBefore || propertyEntryDate > flexDaysAfter) {
          return { lead, matchScore: 0, matchReasons: [`תאריך כניסה לא בטווח הגמיש (±${settings.entry_date_range_flexible} ימים)`], priority: 0 };
        }
        reasons.push('תאריך כניסה בטווח גמיש ✓');
      }
    }
    
    // Case 4: No date preference - skip date validation
  }
  
  // ===== ALL CHECKS PASSED - MATCH! =====
  // Calculate priority score for sorting
  const priority = calculatePriorityScore(property, lead);
  
  return {
    lead,
    matchScore: 100,
    matchReasons: reasons,
    priority
  };
}

// ===== PRIORITY SCORING =====

/**
 * Calculate priority score (0-100) for sorting matched properties
 * Higher score = better match quality within the same binary match
 * 
 * Scoring breakdown:
 * - Price closeness to budget center: 0-30 pts
 * - Rooms closeness to ideal: 0-20 pts
 * - Flexible features that property has: up to 50 pts
 */
export function calculatePriorityScore(property: ScoutedProperty, lead: ContactLead): number {
  let priority = 0;
  
  // ===== PRICE PRIORITY (0-30 points) =====
  if (property.price && lead.budget_max) {
    const budgetMin = lead.budget_min || 0;
    const budgetMid = (budgetMin + lead.budget_max) / 2;
    const priceRatio = property.price / lead.budget_max;
    
    if (property.price <= budgetMid) {
      // Under mid-budget = best priority
      priority += 30;
    } else if (priceRatio <= 0.85) {
      priority += 25;
    } else if (priceRatio <= 1.0) {
      priority += 20;
    } else if (priceRatio <= 1.05) {
      priority += 10;
    } else {
      priority += 5;
    }
  }
  
  // ===== ROOMS PRIORITY (0-20 points) =====
  if (property.rooms && lead.rooms_min && lead.rooms_max) {
    const idealRooms = (lead.rooms_min + lead.rooms_max) / 2;
    const diff = Math.abs(property.rooms - idealRooms);
    
    if (diff === 0) {
      priority += 20;
    } else if (diff <= 0.5) {
      priority += 15;
    } else if (diff <= 1) {
      priority += 10;
    } else {
      priority += 5;
    }
  }
  
  // ===== FLEXIBLE FEATURES BONUS (up to 50 points) =====
  // If lead marked "flexible" but property HAS the feature - bonus!
  
  // Elevator: +8 pts
  if (lead.elevator_required && lead.elevator_flexible && 
      property.features?.elevator === true) {
    priority += 8;
  }
  
  // Parking: +8 pts
  if (lead.parking_required && lead.parking_flexible && 
      property.features?.parking === true) {
    priority += 8;
  }
  
  // Mamad: +8 pts
  if (lead.mamad_required && lead.mamad_flexible && 
      property.features?.mamad === true) {
    priority += 8;
  }
  
  // Balcony: +6 pts
  if (lead.balcony_required && lead.balcony_flexible && 
      property.features?.balcony === true) {
    priority += 6;
  }
  
  // Yard: +6 pts
  if (lead.yard_required && lead.yard_flexible && 
      property.features?.yard === true) {
    priority += 6;
  }
  
  // Roof: +6 pts
  if (lead.roof_required && lead.roof_flexible && 
      property.features?.roof === true) {
    priority += 6;
  }
  
  // Pets: +4 pts
  if (lead.pets && lead.pets_flexible && 
      (property.features?.pets === true || property.features?.allows_pets === true)) {
    priority += 4;
  }
  
  // Furnished: +4 pts
  if (lead.furnished_required && lead.furnished_flexible && property.features?.furnished) {
    priority += 4;
  }
  
  return priority;
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
