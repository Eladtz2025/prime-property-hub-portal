/**
 * Neighborhood support mapping for each property source
 * This module helps filter which neighborhoods are available for each scraping source
 */

// Yad2 neighborhood codes (numeric IDs)
export const yad2SupportedNeighborhoods: Set<string> = new Set([
  // NEW: Source-specific values (yad2_* prefix)
  'yad2_צפון_ישן',
  'yad2_צפון_חדש',
  'yad2_כיכר_המדינה',
  'yad2_לב_העיר',
  'yad2_בבלי',
  'yad2_נווה_צדק',
  'yad2_כרם_התימנים',
  'yad2_רמת_אביב',
  'yad2_פלורנטין',
  'yad2_רוטשילד',
  'yad2_צהלה',
  'yad2_נמל_תל_אביב',
  'yad2_רמת_החייל',
  'yad2_יד_אליהו',
  'yad2_תל_ברוך',
  'yad2_דרום_תל_אביב',
  'yad2_אזורי_חן',
  'yad2_נווה_אביבים',
  'yad2_הדר_יוסף',
  'yad2_נווה_שרת',
  'yad2_יפו',
  // LEGACY: Old values for backward compatibility
  'צפון_ישן',
  'צפון_חדש',
  'כיכר_המדינה',
  'מרכז_העיר',
  'בבלי',
  'נווה_צדק',
  'כרם_התימנים',
  'רמת_אביב',
  'פלורנטין',
  'רוטשילד',
  'צהלה',
  'נמל_תל_אביב',
  'רמת_החייל',
  'יד_אליהו',
  'תל_ברוך',
  'דרום_תל_אביב',
  'אזורי_חן',
  'נווה_אביבים',
  'הדר_יוסף',
  'נווה_שרת',
  'יפו',
]);

// Madlan neighborhood slugs (URL path segments)
export const madlanSupportedNeighborhoods: Set<string> = new Set([
  // NEW: Source-specific values (madlan_* prefix) - granular sub-areas
  'madlan_צפון_ישן_צפוני',
  'madlan_צפון_ישן_מרכזי',
  'madlan_צפון_ישן_דרום_מזרחי',
  'madlan_צפון_ישן_דרום_מערבי',
  'madlan_צפון_חדש_צפוני',
  'madlan_צפון_חדש_דרומי',
  'madlan_כיכר_המדינה',
  'madlan_לב_תל_אביב',
  'madlan_בבלי',
  'madlan_נווה_צדק',
  'madlan_כרם_התימנים',
  'madlan_רמת_אביב',
  'madlan_רמת_אביב_החדשה',
  'madlan_פלורנטין',
  // רוטשילד הוסר - לא קיים כשכונה במדל"ן
  'madlan_שרונה',  // הוספה חדשה
  'madlan_צהלה',
  'madlan_נמל_תל_אביב',
  'madlan_תל_ברוך',
  'madlan_תל_ברוך_צפון',
  'madlan_דרום_העיר',
  'madlan_אזורי_חן',
  'madlan_נווה_אביבים',
  'madlan_הדר_יוסף',
  'madlan_נווה_שרת',
  'madlan_רמת_החייל',
  'madlan_יד_אליהו',
  'madlan_יפו',
  // LEGACY: Old values for backward compatibility
  'צפון_ישן',
  'צפון_חדש',
  'כיכר_המדינה',
  'מרכז_העיר',
  'בבלי',
  'נווה_צדק',
  'כרם_התימנים',
  'רמת_אביב',
  'פלורנטין',
  'רוטשילד',
  'צהלה',
  'נמל_תל_אביב',
  'תל_ברוך',
  'דרום_תל_אביב',
  'אזורי_חן',
  'נווה_אביבים',
  'הדר_יוסף',
  'נווה_שרת',
  'רמת_החייל',
  'יד_אליהו',
  'יפו',
]);

// Homeless supported areas - uses source-specific values (homeless_* prefix)
// Homeless only supports 6 broad areas, not specific neighborhoods!
export const homelessSupportedNeighborhoods: Set<string> = new Set([
  // Source-specific values (these match exactly what appears on homeless.co.il)
  'homeless_תא_מרכז',
  'homeless_תא_דרום',
  'homeless_תא_צפון',
  'homeless_תא_מזרח',
  'homeless_תא_צפון_ירקון',
  'homeless_יפו',
]);

/**
 * Check if a neighborhood is supported by a given source
 */
export function isNeighborhoodSupported(neighborhoodValue: string, source: string): boolean {
  switch (source) {
    case 'yad2':
      return yad2SupportedNeighborhoods.has(neighborhoodValue);
    case 'madlan':
      return madlanSupportedNeighborhoods.has(neighborhoodValue);
    case 'homeless':
      return homelessSupportedNeighborhoods.has(neighborhoodValue);
    default:
      return true; // No filtering for unknown sources
  }
}

/**
 * Get list of sources that support a given neighborhood
 */
export function getSupportedSources(neighborhoodValue: string): string[] {
  const sources: string[] = [];
  if (yad2SupportedNeighborhoods.has(neighborhoodValue)) sources.push('yad2');
  if (madlanSupportedNeighborhoods.has(neighborhoodValue)) sources.push('madlan');
  if (homelessSupportedNeighborhoods.has(neighborhoodValue)) sources.push('homeless');
  return sources;
}

/**
 * Filter neighborhoods array to only those supported by a given source
 */
export function filterNeighborhoodsBySource<T extends { value: string }>(
  neighborhoods: T[],
  source: string
): T[] {
  return neighborhoods.filter(n => isNeighborhoodSupported(n.value, source));
}
