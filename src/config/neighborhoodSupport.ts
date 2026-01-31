/**
 * Neighborhood support mapping for each property source
 * This module helps filter which neighborhoods are available for each scraping source
 */

// Yad2 neighborhood codes (numeric IDs)
export const yad2SupportedNeighborhoods: Set<string> = new Set([
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

// Homeless area codes (broader areas)
export const homelessSupportedNeighborhoods: Set<string> = new Set([
  'צפון_ישן',
  'צפון_חדש',
  'כיכר_המדינה',
  'בבלי',
  'רמת_אביב',
  'נמל_תל_אביב',
  'צהלה',
  'תל_ברוך',
  'נווה_אביבים',
  'הדר_יוסף',
  'רמת_החייל',
  // South area
  'פלורנטין',
  'נווה_צדק',
  'דרום_תל_אביב',
  // East area
  'יד_אליהו',
  'נווה_שרת',
  // Central area
  'מרכז_העיר',
  'כרם_התימנים',
  'רוטשילד',
  'אזורי_חן',
  // Jaffa
  'יפו',
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
