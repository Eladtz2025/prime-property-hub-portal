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
  'צהלה': '494',
  'רוטשילד': '205',
  'נמל_תל_אביב': '1519',
  'נמל תל אביב': '1519',
  'שרונה': '1520',
  'גני_שרונה': '1520',
  'גני שרונה': '1520',
  'רמת_החייל': '1523',
  'רמת החייל': '1523',
  'יד_אליהו': '1522',
  'יד אליהו': '1522',
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
