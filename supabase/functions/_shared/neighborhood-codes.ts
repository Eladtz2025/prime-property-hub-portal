/**
 * Neighborhood codes for URL-level filtering across all property sources
 * Used by URL builders to construct source-specific search URLs
 */

// Yad2 neighborhood codes (numeric IDs)
export const yad2NeighborhoodCodes: Record<string, string> = {
  // צפון תל אביב
  'צפון_ישן': '1483',
  'צפון ישן': '1483',
  'צפון_חדש': '204',
  'צפון חדש': '204',
  
  // מרכז
  'כיכר_המדינה': '1516',
  'כיכר המדינה': '1516',
  'מרכז_העיר': '1520',
  'מרכז העיר': '1520',
  'לב_העיר': '1520',
  'לב העיר': '1520',
  'לב_תל_אביב': '1520',
  'לב תל אביב': '1520',
  
  // שכונות נוספות
  'בבלי': '1518',
  'נווה_צדק': '848',
  'נווה צדק': '848',
  'כרם_התימנים': '1521',
  'כרם התימנים': '1521',
  'רמת_אביב': '197',
  'רמת אביב': '197',
  'פלורנטין': '205',
  'רוטשילד': '205',
  'צהלה': '494',
  'נמל_תל_אביב': '1519',
  'נמל תל אביב': '1519',
  'רמת_החייל': '1523',
  'רמת החייל': '1523',
  'יד_אליהו': '1522',
  'יד אליהו': '1522',
  'תל_ברוך': '1524',
  'תל ברוך': '1524',
  'דרום_תל_אביב': '1525',
  'דרום תל אביב': '1525',
  'אזורי_חן': '1517',
  'אזורי חן': '1517',
  'נווה_אביבים': '1526',
  'נווה אביבים': '1526',
  'הדר_יוסף': '1527',
  'הדר יוסף': '1527',
  'נווה_שרת': '1528',
  'נווה שרת': '1528',
  'יפו': '203',
};

// Madlan neighborhood slugs (URL path segments)
// Format: neighborhood-slug that goes BEFORE city name in URL
export const madlanNeighborhoodSlugs: Record<string, string> = {
  'צפון_ישן': 'הצפון-הישן-החלק-הצפוני',
  'צפון ישן': 'הצפון-הישן-החלק-הצפוני',
  'צפון_חדש': 'הצפון-החדש',
  'צפון חדש': 'הצפון-החדש',
  'כיכר_המדינה': 'הצפון-החדש-סביבת-כיכר-המדינה',
  'כיכר המדינה': 'הצפון-החדש-סביבת-כיכר-המדינה',
  'מרכז_העיר': 'לב-תל-אביב-לב-העיר-צפון',
  'מרכז העיר': 'לב-תל-אביב-לב-העיר-צפון',
  'בבלי': 'בבלי',
  'נווה_צדק': 'נווה-צדק',
  'נווה צדק': 'נווה-צדק',
  'כרם_התימנים': 'כרם-התימנים',
  'כרם התימנים': 'כרם-התימנים',
  'רמת_אביב': 'רמת-אביב-החדשה',
  'רמת אביב': 'רמת-אביב-החדשה',
  'פלורנטין': 'פלורנטין',
  'רוטשילד': 'שדרות-רוטשילד',
  'צהלה': 'גני-צהלה-רמות-צהלה',
  'נמל_תל_אביב': 'נמל-תל-אביב',
  'נמל תל אביב': 'נמל-תל-אביב',
  'יפו': 'יפו',
  'תל_ברוך': 'תל-ברוך',
  'תל ברוך': 'תל-ברוך',
  'דרום_תל_אביב': 'דרום-העיר',
  'דרום תל אביב': 'דרום-העיר',
  'אזורי_חן': 'אזורי-חן',
  'אזורי חן': 'אזורי-חן',
  'נווה_אביבים': 'נווה-אביבים',
  'נווה אביבים': 'נווה-אביבים',
  'הדר_יוסף': 'הדר-יוסף',
  'הדר יוסף': 'הדר-יוסף',
  'נווה_שרת': 'נווה-שרת',
  'נווה שרת': 'נווה-שרת',
  'רמת_החייל': 'רמת-החייל',
  'רמת החייל': 'רמת-החייל',
  'יד_אליהו': 'יד-אליהו',
  'יד אליהו': 'יד-אליהו',
};

// Homeless area codes (inumber1 parameter)
// Homeless uses broader area codes, not specific neighborhoods
export const homelessAreaCodes: Record<string, string> = {
  // תל אביב צפון (inumber1=1)
  'צפון_ישן': '1',
  'צפון ישן': '1',
  'צפון_חדש': '1',
  'צפון חדש': '1',
  'כיכר_המדינה': '1',
  'כיכר המדינה': '1',
  'בבלי': '1',
  'רמת_אביב': '1',
  'רמת אביב': '1',
  'נמל_תל_אביב': '1',
  'נמל תל אביב': '1',
  'צהלה': '1',
  'תל_ברוך': '1',
  'תל ברוך': '1',
  'נווה_אביבים': '1',
  'נווה אביבים': '1',
  'הדר_יוסף': '1',
  'הדר יוסף': '1',
  'רמת_החייל': '1',
  'רמת החייל': '1',
  
  // תל אביב דרום (inumber1=2)
  'פלורנטין': '2',
  'נווה_צדק': '2',
  'נווה צדק': '2',
  'דרום_תל_אביב': '2',
  'דרום תל אביב': '2',
  
  // תל אביב מזרח (inumber1=382)
  'יד_אליהו': '382',
  'יד אליהו': '382',
  'נווה_שרת': '382',
  'נווה שרת': '382',
  
  // תל אביב מרכז - using city code
  'מרכז_העיר': '150',
  'מרכז העיר': '150',
  'כרם_התימנים': '150',
  'כרם התימנים': '150',
  'רוטשילד': '150',
  'אזורי_חן': '150',
  'אזורי חן': '150',
  
  // יפו (separate area)
  'יפו': '3',
};

/**
 * Convert neighborhood names to Yad2 codes
 * Returns only valid codes, skips unknown neighborhoods
 */
export function getYad2NeighborhoodCodes(neighborhoods: string[]): string[] {
  const codes: string[] = [];
  
  for (const neighborhood of neighborhoods) {
    const code = yad2NeighborhoodCodes[neighborhood];
    if (code && !codes.includes(code)) {
      codes.push(code);
    }
  }
  
  return codes;
}

/**
 * Get Madlan slug for a single neighborhood
 * Returns null if no mapping exists
 */
export function getMadlanNeighborhoodSlug(neighborhood: string): string | null {
  return madlanNeighborhoodSlugs[neighborhood] || null;
}

/**
 * Get all unique Homeless area codes for given neighborhoods
 * Returns unique codes (neighborhoods in same area share the same code)
 */
export function getHomelessAreaCodes(neighborhoods: string[]): string[] {
  const codes: string[] = [];
  
  for (const neighborhood of neighborhoods) {
    const code = homelessAreaCodes[neighborhood];
    if (code && !codes.includes(code)) {
      codes.push(code);
    }
  }
  
  return codes;
}
