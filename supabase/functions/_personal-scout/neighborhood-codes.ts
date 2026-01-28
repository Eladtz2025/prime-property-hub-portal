/**
 * Yad2 Neighborhood Codes for Tel Aviv
 * Used for URL-level filtering in Personal Scout
 */

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
  
  // שכונות נוספות
  'בבלי': '1518',
  'נווה_צדק': '848',
  'נווה צדק': '848',
  'כרם_התימנים': '1521',
  'כרם התימנים': '1521',
  'רמת_אביב': '197',
  'רמת אביב': '197',
  'פלורנטין': '205',
  'צהלה': '494',
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
