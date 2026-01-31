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

// Madlan neighborhood sub-areas (with שכונה- prefix for proper recognition)
// Large neighborhoods like צפון ישן/חדש need multiple sub-areas
export const madlanNeighborhoodSubAreas: Record<string, string[]> = {
  // צפון ישן - 4 תת-אזורים
  'צפון_ישן': [
    'שכונה-הצפון-הישן-החלק-הצפוני',
    'שכונה-הצפון-הישן-החלק-המרכזי',
    'שכונה-הצפון-הישן-החלק-הדרום-מזרחי',
    'שכונה-הצפון-הישן-החלק-הדרום-מערבי',
  ],
  'צפון ישן': [
    'שכונה-הצפון-הישן-החלק-הצפוני',
    'שכונה-הצפון-הישן-החלק-המרכזי',
    'שכונה-הצפון-הישן-החלק-הדרום-מזרחי',
    'שכונה-הצפון-הישן-החלק-הדרום-מערבי',
  ],
  
  // צפון חדש - 3 תת-אזורים
  'צפון_חדש': [
    'שכונה-הצפון-החדש-החלק-הצפוני',
    'שכונה-הצפון-החדש-החלק-הדרומי',
    'שכונה-הצפון-החדש-סביבת-כיכר-המדינה',
  ],
  'צפון חדש': [
    'שכונה-הצפון-החדש-החלק-הצפוני',
    'שכונה-הצפון-החדש-החלק-הדרומי',
    'שכונה-הצפון-החדש-סביבת-כיכר-המדינה',
  ],
  
  // כיכר המדינה - תת-אזור של צפון חדש
  'כיכר_המדינה': ['שכונה-הצפון-החדש-סביבת-כיכר-המדינה'],
  'כיכר המדינה': ['שכונה-הצפון-החדש-סביבת-כיכר-המדינה'],
  
  // מרכז העיר / לב תל אביב
  'מרכז_העיר': ['שכונה-לב-תל-אביב'],
  'מרכז העיר': ['שכונה-לב-תל-אביב'],
  'לב_תל_אביב': ['שכונה-לב-תל-אביב'],
  'לב תל אביב': ['שכונה-לב-תל-אביב'],
  
  // שכונות בודדות
  'בבלי': ['שכונה-בבלי'],
  'נווה_צדק': ['שכונה-נווה-צדק'],
  'נווה צדק': ['שכונה-נווה-צדק'],
  'כרם_התימנים': ['שכונה-כרם-התימנים'],
  'כרם התימנים': ['שכונה-כרם-התימנים'],
  
  // רמת אביב - 2 תת-אזורים
  'רמת_אביב': ['שכונה-רמת-אביב', 'שכונה-רמת-אביב-החדשה'],
  'רמת אביב': ['שכונה-רמת-אביב', 'שכונה-רמת-אביב-החדשה'],
  
  'פלורנטין': ['שכונה-פלורנטין'],
  'רוטשילד': ['שכונה-שדרות-רוטשילד'],
  'צהלה': ['שכונה-גני-צהלה-רמות-צהלה'],
  'נמל_תל_אביב': ['שכונה-נמל-תל-אביב'],
  'נמל תל אביב': ['שכונה-נמל-תל-אביב'],
  'יפו': ['שכונה-יפו'],
  
  // תל ברוך - 2 תת-אזורים
  'תל_ברוך': ['שכונה-תל-ברוך', 'שכונה-תל-ברוך-צפון'],
  'תל ברוך': ['שכונה-תל-ברוך', 'שכונה-תל-ברוך-צפון'],
  
  'דרום_תל_אביב': ['שכונה-דרום-העיר'],
  'דרום תל אביב': ['שכונה-דרום-העיר'],
  'אזורי_חן': ['שכונה-אזורי-חן'],
  'אזורי חן': ['שכונה-אזורי-חן'],
  'נווה_אביבים': ['שכונה-נווה-אביבים'],
  'נווה אביבים': ['שכונה-נווה-אביבים'],
  'הדר_יוסף': ['שכונה-הדר-יוסף'],
  'הדר יוסף': ['שכונה-הדר-יוסף'],
  'נווה_שרת': ['שכונה-נווה-שרת'],
  'נווה שרת': ['שכונה-נווה-שרת'],
  'רמת_החייל': ['שכונה-רמת-החייל'],
  'רמת החייל': ['שכונה-רמת-החייל'],
  'יד_אליהו': ['שכונה-יד-אליהו'],
  'יד אליהו': ['שכונה-יד-אליהו'],
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

// City slug mapping for Madlan URLs
const madlanCityMap: Record<string, string> = {
  'תל אביב': 'תל-אביב-יפו',
  'תל אביב יפו': 'תל-אביב-יפו',
  'ירושלים': 'ירושלים',
  'חיפה': 'חיפה',
  'ראשון לציון': 'ראשון-לציון',
  'פתח תקווה': 'פתח-תקווה',
  'אשדוד': 'אשדוד',
  'נתניה': 'נתניה',
  'באר שבע': 'באר-שבע',
  'חולון': 'חולון',
  'בת ים': 'בת-ים',
  'רמת גן': 'רמת-גן',
  'הרצליה': 'הרצליה',
  'רעננה': 'רעננה',
  'גבעתיים': 'גבעתיים',
  'כפר סבא': 'כפר-סבא',
  'הוד השרון': 'הוד-השרון',
  'רמת השרון': 'רמת-השרון',
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
 * @deprecated Use getMadlanMultiNeighborhoodPath instead
 */
export function getMadlanNeighborhoodSlug(neighborhood: string): string | null {
  const subAreas = madlanNeighborhoodSubAreas[neighborhood];
  return subAreas ? subAreas[0] : null;
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

/**
 * Get multiple Madlan neighborhood slugs as comma-separated URL path
 * Format: שכונה-neighborhood-city-ישראל,שכונה-neighborhood2-city-ישראל
 * Uses sub-areas for large neighborhoods (צפון ישן/חדש = 3 sub-areas each)
 */
export function getMadlanMultiNeighborhoodPath(
  neighborhoods: string[], 
  city: string
): string | null {
  const allSlugs: string[] = [];
  const citySlug = madlanCityMap[city] || city.replace(/\s+/g, '-');
  
  for (const neighborhood of neighborhoods) {
    // Get array of sub-areas for this neighborhood
    const subAreas = madlanNeighborhoodSubAreas[neighborhood] || 
                     madlanNeighborhoodSubAreas[neighborhood.replace(/ /g, '_')];
    
    if (subAreas) {
      for (const subArea of subAreas) {
        // Format: שכונה-שם-תת-אזור-city-ישראל
        const fullSlug = `${subArea}-${citySlug}-ישראל`;
        if (!allSlugs.includes(fullSlug)) {
          allSlugs.push(fullSlug);
        }
      }
    }
  }
  
  if (allSlugs.length === 0) return null;
  
  // Join with commas for Madlan multi-neighborhood URL format
  return allSlugs.join(',');
}
