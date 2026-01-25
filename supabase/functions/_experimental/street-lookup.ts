/**
 * Street-to-Neighborhood Lookup Utility
 * 
 * EXPERIMENTAL - Completely isolated from production code
 * Uses the street_neighborhoods table to identify neighborhoods from street names
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// Types
// ============================================

export interface StreetLookupResult {
  neighborhood: string;
  neighborhood_value: string;
  confidence: number;
  source: 'database' | 'regex';
}

// ============================================
// Street Name Normalization
// ============================================

/**
 * Normalize street name for database lookup
 * Removes house numbers, prefixes, and common suffixes
 * Also normalizes common spelling variations
 */
export function normalizeStreetName(street: string): string {
  if (!street) return '';
  
  let normalized = street
    // Remove house numbers at beginning or end
    .replace(/^\d+[\s,]*/g, '')
    .replace(/[\s,]*\d+$/g, '')
    // Remove common prefixes
    .replace(/^(רח'|רחוב|שד'|שדרות|סמ'|סמטת)\s*/i, '')
    // Remove floor/apartment info
    .replace(/\s*(קומה|דירה|בניין)\s*\d*/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
}

/**
 * Generate spelling variations for fuzzy matching
 * Handles common Hebrew spelling inconsistencies
 */
export function generateSpellingVariations(street: string): string[] {
  const variations: string[] = [street];
  
  // Common Hebrew spelling variations
  const rules: Array<[RegExp, string]> = [
    // וי → ו (ויינגייט → וינגייט)
    [/וי/g, 'ו'],
    // יי → י (ביאליק → בילק rarely, but common in other words)
    [/יי/g, 'י'],
    // Remove geresh from abbreviations
    [/'/g, ''],
    // ה at end variations
    [/ה$/g, ''],
    // Double letters
    [/(.)\1/g, '$1'],
  ];
  
  for (const [pattern, replacement] of rules) {
    const variation = street.replace(pattern, replacement);
    if (variation !== street && !variations.includes(variation)) {
      variations.push(variation);
    }
  }
  
  return variations;
}

/**
 * Extract street name from full address
 * "ויינגייט 15, תל אביב" → "ויינגייט"
 */
export function extractStreetFromAddress(address: string): string {
  if (!address) return '';
  
  // Split by comma - street is usually first part
  const parts = address.split(',');
  const streetPart = parts[0] || address;
  
  return normalizeStreetName(streetPart);
}

// ============================================
// Database Lookup
// ============================================

/**
 * Look up neighborhood by street name using the database
 */
export async function lookupNeighborhoodByStreet(
  supabase: SupabaseClient,
  streetName: string,
  city: string
): Promise<StreetLookupResult | null> {
  if (!streetName || !city) return null;
  
  const normalizedStreet = normalizeStreetName(streetName);
  if (!normalizedStreet) return null;
  
  // Generate spelling variations for better matching
  const variations = generateSpellingVariations(normalizedStreet);
  
  try {
    // Try each variation for exact match
    for (const variation of variations) {
      const { data: exactMatch, error: exactError } = await supabase
        .from('street_neighborhoods')
        .select('neighborhood, confidence')
        .eq('city', city)
        .eq('street_name', variation)
        .order('confidence', { ascending: false })
        .limit(1)
        .single();
      
      if (!exactError && exactMatch) {
        return {
          neighborhood: exactMatch.neighborhood,
          neighborhood_value: normalizeNeighborhoodToValue(exactMatch.neighborhood),
          confidence: exactMatch.confidence || 80,
          source: 'database'
        };
      }
    }
    
    // Fuzzy match - try with ilike for partial matches on all variations
    for (const variation of variations) {
      const { data: fuzzyMatch, error: fuzzyError } = await supabase
        .from('street_neighborhoods')
        .select('neighborhood, confidence')
        .eq('city', city)
        .ilike('street_name', `%${variation}%`)
        .order('confidence', { ascending: false })
        .limit(1)
        .single();
    
      if (!fuzzyError && fuzzyMatch) {
        return {
          neighborhood: fuzzyMatch.neighborhood,
          neighborhood_value: normalizeNeighborhoodToValue(fuzzyMatch.neighborhood),
          confidence: Math.max((fuzzyMatch.confidence || 80) - 10, 50), // Reduce confidence for fuzzy
          source: 'database'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('[street-lookup] Database error:', error);
    return null;
  }
}

/**
 * Batch lookup for multiple streets
 */
export async function batchLookupStreets(
  supabase: SupabaseClient,
  streets: Array<{ street: string; city: string }>
): Promise<Map<string, StreetLookupResult>> {
  const results = new Map<string, StreetLookupResult>();
  
  // Group by city for efficiency
  const byCity = new Map<string, string[]>();
  for (const { street, city } of streets) {
    const normalized = normalizeStreetName(street);
    if (!normalized || !city) continue;
    
    if (!byCity.has(city)) {
      byCity.set(city, []);
    }
    byCity.get(city)!.push(normalized);
  }
  
  // Query each city
  for (const [city, streetNames] of byCity.entries()) {
    const { data, error } = await supabase
      .from('street_neighborhoods')
      .select('street_name, neighborhood, confidence')
      .eq('city', city)
      .in('street_name', streetNames);
    
    if (!error && data) {
      for (const row of data) {
        const key = `${row.street_name}|${city}`;
        results.set(key, {
          neighborhood: row.neighborhood,
          neighborhood_value: normalizeNeighborhoodToValue(row.neighborhood),
          confidence: row.confidence || 80,
          source: 'database'
        });
      }
    }
  }
  
  return results;
}

// ============================================
// Neighborhood Value Normalization
// ============================================

/**
 * Convert neighborhood label to normalized value
 * "צפון ישן" → "צפון_ישן"
 * Also handles complex variants like "הצפון הישן החלק הצפוני" → "צפון_ישן"
 */
export function normalizeNeighborhoodToValue(neighborhood: string): string {
  if (!neighborhood) return '';
  
  const lowerNeighborhood = neighborhood.toLowerCase();
  
  // Pattern-based mappings for complex neighborhood names
  // These capture all variants (החלק הצפוני, החלק הדרומי, etc.)
  const patternMappings: Array<{ pattern: RegExp; value: string }> = [
    // צפון ישן variants
    { pattern: /צפון\s*(?:ה)?ישן|הצפון\s*הישן/i, value: 'צפון_ישן' },
    // צפון חדש variants
    { pattern: /צפון\s*(?:ה)?חדש|הצפון\s*החדש/i, value: 'צפון_חדש' },
    // מרכז העיר variants
    { pattern: /מרכז\s*(?:ה)?עיר|לב\s*(?:ה)?עיר|לב\s*תל\s*אביב/i, value: 'מרכז_העיר' },
    // רמת אביב variants
    { pattern: /רמת\s*אביב/i, value: 'רמת_אביב' },
    // פלורנטין
    { pattern: /פלורנטין|נחלת\s*בנימין/i, value: 'פלורנטין' },
    // נווה צדק
    { pattern: /נו?ו?ה?\s*צדק/i, value: 'נווה_צדק' },
    // רוטשילד / שרונה
    { pattern: /רוטשילד|שרונה|גני\s*שרונה|קרית\s*הממשלה|מונטיפיורי/i, value: 'רוטשילד' },
    // כרם התימנים
    { pattern: /כרם\s*(?:ה)?תימנים|הירקון/i, value: 'כרם_התימנים' },
    // כיכר המדינה
    { pattern: /כיכר\s*(?:ה)?מדינה/i, value: 'כיכר_המדינה' },
    // יפו
    { pattern: /^יפו|עג'מי|עגמי/i, value: 'יפו' },
    // צהלה
    { pattern: /צהלה|גני\s*צהלה|כוכב\s*הצפון/i, value: 'צהלה' },
    // בבלי
    { pattern: /בבלי/i, value: 'בבלי' },
    // נמל תל אביב
    { pattern: /נמל|יורדי\s*הסירה/i, value: 'נמל_תל_אביב' },
    // תל ברוך
    { pattern: /תל\s*ברוך/i, value: 'תל_ברוך' },
    // דרום תל אביב
    { pattern: /שפירא|נו?ו?ה?\s*שאנן|התקווה|כפר\s*שלם|יד\s*אליהו/i, value: 'דרום_תל_אביב' },
    // אזורי חן
    { pattern: /אזורי\s*חן|גימל\s*החדשה/i, value: 'אזורי_חן' },
    // נווה אביבים
    { pattern: /נו?ו?ה?\s*אביבים/i, value: 'נווה_אביבים' },
    // הדר יוסף
    { pattern: /הדר\s*יוסף/i, value: 'הדר_יוסף' },
    // נווה שרת
    { pattern: /נו?ו?ה?\s*שרת/i, value: 'נווה_שרת' },
    // Ramat Gan
    { pattern: /בורסה|יהודה\s*המכבי/i, value: 'בורסה' },
    { pattern: /רמת\s*חן/i, value: 'רמת_חן' },
    { pattern: /תל\s*בנימין/i, value: 'תל_בנימין' },
    { pattern: /נחלת\s*גנים/i, value: 'נחלת_גנים' },
    // Herzliya
    { pattern: /הרצליה\s*פיתוח|פיתוח/i, value: 'הרצליה_פיתוח' },
  ];
  
  // Try pattern matching
  for (const { pattern, value } of patternMappings) {
    if (pattern.test(neighborhood)) {
      return value;
    }
  }
  
  // Fallback: convert spaces to underscores
  return neighborhood.replace(/\s+/g, '_');
}

// ============================================
// Create Supabase Client Helper
// ============================================

/**
 * Create Supabase client for edge function use
 */
export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return createClient(supabaseUrl, supabaseKey);
}
