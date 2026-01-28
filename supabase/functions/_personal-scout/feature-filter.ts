/**
 * Feature Filter for Personal Scout
 * 
 * NEW FILE - Filters properties by lead preferences AFTER parsing
 * Handles: neighborhoods, budget (for Madlan/Homeless), rooms, features
 */

import type { ParsedProperty } from './parser-utils.ts';

export interface LeadPreferences {
  preferred_neighborhoods?: string[] | null;
  budget_min?: number | null;
  budget_max?: number | null;
  rooms_min?: number | null;
  rooms_max?: number | null;
  // Feature requirements
  balcony_required?: boolean | null;
  balcony_flexible?: boolean | null;
  parking_required?: boolean | null;
  parking_flexible?: boolean | null;
  elevator_required?: boolean | null;
  elevator_flexible?: boolean | null;
  mamad_required?: boolean | null;
  mamad_flexible?: boolean | null;
  yard_required?: boolean | null;
  yard_flexible?: boolean | null;
  roof_required?: boolean | null;
  roof_flexible?: boolean | null;
}

export interface FilterResult {
  passed: ParsedProperty[];
  filtered_out: number;
  filter_reasons: Record<string, number>;
}

/**
 * Filter properties by lead preferences
 * Applied AFTER parsing - handles what URL filters can't
 */
export function filterByLeadPreferences(
  properties: ParsedProperty[],
  lead: LeadPreferences,
  source: string
): FilterResult {
  const passed: ParsedProperty[] = [];
  const filterReasons: Record<string, number> = {};
  
  for (const prop of properties) {
    const rejection = checkProperty(prop, lead, source);
    
    if (rejection) {
      filterReasons[rejection] = (filterReasons[rejection] || 0) + 1;
    } else {
      passed.push(prop);
    }
  }
  
  console.log(`[personal-scout/filter] Source: ${source}, Input: ${properties.length}, Passed: ${passed.length}`);
  if (Object.keys(filterReasons).length > 0) {
    console.log(`[personal-scout/filter] Rejection reasons:`, filterReasons);
  }
  
  return {
    passed,
    filtered_out: properties.length - passed.length,
    filter_reasons: filterReasons
  };
}

/**
 * Check if a property passes all filters
 * Returns rejection reason or null if passed
 */
function checkProperty(
  prop: ParsedProperty,
  lead: LeadPreferences & { preferred_cities?: string[] },
  source: string
): string | null {
  // 0. City filter - CRITICAL: Reject properties from wrong cities
  // Madlan parser sets city='תל אביב יפו' by default, but address might reveal real city
  if (lead.preferred_cities && lead.preferred_cities.length > 0 && prop.city) {
    const propCity = normalizeCity(prop.city);
    const matchesCity = lead.preferred_cities.some(c => normalizeCity(c) === propCity);
    if (!matchesCity) {
      // Additional check: address might contain a different city name
      const addressCity = extractCityFromAddress(prop.address || '');
      if (addressCity && !lead.preferred_cities.some(c => normalizeCity(c) === addressCity)) {
        return 'wrong_city';
      }
    }
  }
  
  // 1. Budget filter (for Madlan/Homeless that don't support URL filter)
  // Yad2 already filters by price in URL, but double-check
  if (lead.budget_max && prop.price && prop.price > lead.budget_max) {
    return 'price_too_high';
  }
  if (lead.budget_min && prop.price && prop.price < lead.budget_min) {
    return 'price_too_low';
  }
  
  // 2. Rooms filter (for Madlan/Homeless that don't support URL filter)
  if (lead.rooms_min && prop.rooms && prop.rooms < lead.rooms_min) {
    return 'too_few_rooms';
  }
  if (lead.rooms_max && prop.rooms && prop.rooms > lead.rooms_max) {
    return 'too_many_rooms';
  }
  
  // 3. Neighborhood filter - critical for personal scout
  if (lead.preferred_neighborhoods && lead.preferred_neighborhoods.length > 0) {
    if (!prop.neighborhood) {
      // If property has no neighborhood, we can't match - be lenient and allow
      // return 'no_neighborhood';
    } else {
      const matchesNeighborhood = lead.preferred_neighborhoods.some(n => {
        const normalizedPref = normalizeNeighborhood(n);
        const normalizedProp = normalizeNeighborhood(prop.neighborhood || '');
        return normalizedProp.includes(normalizedPref) || normalizedPref.includes(normalizedProp);
      });
      
      if (!matchesNeighborhood) {
        return 'wrong_neighborhood';
      }
    }
  }
  
  // 4. Outdoor space filter (balcony/roof/yard) - OR logic
  // If lead requires any outdoor space, check if property has at least one
  // Note: Parsers don't yet extract these features, so we only filter
  // when we have explicit false values (not undefined/null)
  const hasOutdoorRequirement = 
    (lead.balcony_required && !lead.balcony_flexible) ||
    (lead.roof_required && !lead.roof_flexible) ||
    (lead.yard_required && !lead.yard_flexible);
  
  if (hasOutdoorRequirement) {
    // Check if property explicitly has NO outdoor space
    // Only filter if we have explicit false values (not undefined)
    const hasBalcony = (prop as any).has_balcony;
    const hasRoof = (prop as any).has_roof;
    const hasYard = (prop as any).has_yard;
    
    // If all are explicitly false, reject
    // If any is true or undefined, allow (benefit of the doubt)
    const allExplicitlyFalse = 
      hasBalcony === false && 
      hasRoof === false && 
      hasYard === false;
    
    if (allExplicitlyFalse) {
      return 'no_outdoor_space';
    }
  }
  
  // 5. Parking filter (if strictly required)
  if (lead.parking_required && !lead.parking_flexible) {
    const hasParking = (prop as any).has_parking;
    if (hasParking === false) {
      return 'no_parking';
    }
  }
  
  // 6. Elevator filter (if strictly required)
  if (lead.elevator_required && !lead.elevator_flexible) {
    const hasElevator = (prop as any).has_elevator;
    if (hasElevator === false) {
      return 'no_elevator';
    }
  }
  
  // Property passed all filters
  return null;
}

/**
 * Normalize neighborhood name for comparison
 */
function normalizeNeighborhood(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\-_]/g, '') // Remove spaces, dashes, underscores
    .replace(/['"״]/g, '')   // Remove quotes
    .replace(/ה$/g, '')      // Remove trailing ה (definite article)
    .trim();
}

/**
 * Normalize city name for comparison
 */
function normalizeCity(name: string): string {
  return name
    .replace(/[\s\-_]/g, '')
    .replace(/יפו/g, '') // Treat "תל אביב" and "תל אביב יפו" as same
    .trim();
}

/**
 * Known cities that appear in Israeli property listings
 * Used to detect when a property is actually in a different city
 */
const KNOWN_CITIES = [
  { pattern: /רמת\s*גן/i, normalized: 'רמתגן' },
  { pattern: /גבעתיים/i, normalized: 'גבעתיים' },
  { pattern: /בני\s*ברק/i, normalized: 'בניברק' },
  { pattern: /חולון/i, normalized: 'חולון' },
  { pattern: /בת\s*ים/i, normalized: 'בתים' },
  { pattern: /הרצליה/i, normalized: 'הרצליה' },
  { pattern: /רעננה/i, normalized: 'רעננה' },
  { pattern: /פתח\s*תקוה/i, normalized: 'פתחתקוה' },
  { pattern: /ראשון\s*לציון/i, normalized: 'ראשוןלציון' },
];

/**
 * Extract city from address if present (e.g., "הרב חבה, רמת גן" → "רמתגן")
 */
function extractCityFromAddress(address: string): string | null {
  for (const { pattern, normalized } of KNOWN_CITIES) {
    if (pattern.test(address)) {
      return normalized;
    }
  }
  return null;
}

/**
 * Quick utility to check if lead has enough preferences for personal scout
 */
export function hasMinimalPreferences(lead: LeadPreferences & { preferred_cities?: string[] }): boolean {
  // Must have at least city preference
  if (!lead.preferred_cities || lead.preferred_cities.length === 0) {
    return false;
  }
  
  // Should have at least one of: budget, rooms, or neighborhoods
  const hasBudget = lead.budget_min || lead.budget_max;
  const hasRooms = lead.rooms_min || lead.rooms_max;
  const hasNeighborhoods = lead.preferred_neighborhoods && lead.preferred_neighborhoods.length > 0;
  
  return hasBudget || hasRooms || hasNeighborhoods;
}
