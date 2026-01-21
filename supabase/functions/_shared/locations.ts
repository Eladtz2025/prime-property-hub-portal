// Shared locations configuration for Edge Functions
// This file mirrors the frontend config at src/config/locations.ts

export interface Neighborhood {
  value: string;
  label: string;
  aliases: string[];
}

export const NEIGHBORHOODS: Record<string, Neighborhood[]> = {
  'תל אביב יפו': [
    { 
      value: 'צפון_ישן', 
      label: 'צפון ישן', 
      aliases: [
        'הצפון הישן', 
        'הצפון הישן - צפון', 
        'הצפון הישן - דרום', 
        'הצפון הישן החלק הצפוני', 
        'הצפון הישן החלק המרכזי', 
        'הצפון הישן החלק הדרום מזרחי', 
        'הצפון הישן החלק הדרום מערבי',
        'צפון הישן',
        'old north',
        'oldnorth',
        'OldNorth',
        'צפון הישן / צפון החדש',
        'צפון החדש / צפון הישן',
        'הצפון הישן צפון',
        'הצפון הישן דרום'
      ] 
    },
    { 
      value: 'צפון_חדש', 
      label: 'צפון חדש', 
      aliases: [
        'הצפון החדש', 
        'הצפון החדש - צפון', 
        'הצפון החדש - דרום', 
        'הצפון החדש החלק הצפוני', 
        'הצפון החדש החלק הדרומי',
        'הצפון החדש סביבת כיכר המדינה',
        'הצפון החדש סביבת כיכר',
        'הצפון החדש - כיכר המדינה',
        'new north',
        'צפון החדש',
        'לואי מרשל',
        'louis marshall',
        'יהודה המכבי, הצפון החדש - צפון',
        'הצפון החדש צפון',
        'הצפון החדש דרום'
      ] 
    },
    { 
      value: 'מרכז_העיר', 
      label: 'מרכז העיר', 
      aliases: [
        'לב העיר', 
        'לב תל אביב', 
        'לב העיר צפון',
        'לב העיר דרום',
        'לב תל אביב, לב העיר צפון',
        'לב תל אביב, לב העיר דרום',
        'לב תל אביב החלק המערבי',
        'מרכז',
        'center',
        'לבהעיר',
        'מונטיפיורי, הרכבת',
        'הרכבת'
      ] 
    },
    { 
      value: 'פלורנטין', 
      label: 'פלורנטין', 
      aliases: [
        'דרום פלורנטין', 
        'נחלת בנימין, פלורנטין', 
        'נחלת בנימין',
        'florentin'
      ] 
    },
    { 
      value: 'נווה_צדק', 
      label: 'נווה צדק', 
      aliases: [
        'neve tzedek',
        'נוה צדק',
        'נוה צדק, מונטיפיורי',
        'neve tzedek, montefiore'
      ] 
    },
    { 
      value: 'רוטשילד', 
      label: 'רוטשילד', 
      aliases: [
        'דרום רוטשילד', 
        'מונטיפיורי', 
        'שרונה', 
        'גני שרונה',
        'גני שרונה, קרית הממשלה',
        'קרית הממשלה',
        'rothschild'
      ] 
    },
    { 
      value: 'כרם_התימנים', 
      label: 'כרם התימנים', 
      aliases: [
        'הירקון',
        'kerem hateimanim'
      ] 
    },
    { 
      value: 'כיכר_המדינה', 
      label: 'כיכר המדינה', 
      aliases: [
        'אזור ככר המדינה', 
        'הצפון החדש סביבת כיכר המדינה',
        'הצפון החדש - כיכר המדינה',
        'סביבת כיכר המדינה',
        'זכות לדירה בכיכר המדינה',
        'kikar hamedina',
        'ככר המדינה'
      ] 
    },
    { 
      value: 'רמת_אביב', 
      label: 'רמת אביב', 
      aliases: [
        'רמת אביב החדשה', 
        'רמת אביב ג', 
        'רמת אביב ג\'',
        'נופי ים', 
        'הגוש הגדול',
        'הגוש הגדול, רמת אביב החדשה, נופי ים',
        'ramat aviv'
      ] 
    },
    { 
      value: 'יפו', 
      label: 'יפו', 
      aliases: [
        'יפו ג', 
        'יפו ד', 
        'יפו העתיקה', 
        'עג\'מי', 
        'מרכז יפו', 
        'צפון יפו',
        'jaffa'
      ] 
    },
    { 
      value: 'צהלה', 
      label: 'צהלה', 
      aliases: [
        'גני צהלה', 
        'צהלון', 
        'רמות צהלה',
        'גני צהלה, רמות צהלה',
        'כוכב הצפון',
        'tzahala'
      ] 
    },
    { 
      value: 'בבלי', 
      label: 'בבלי', 
      aliases: [
        'שיכון בבלי',
        'הבשן',
        'bavli',
        'בבלי, הבשן',
        'bavli, tel aviv'
      ] 
    },
    { 
      value: 'נמל_תל_אביב', 
      label: 'נמל תל אביב', 
      aliases: [
        'כ״ג יורדי הסירה',
        'יורדי הסירה',
        'נחשון',
        'ירמיהו',
        'הושע',
        'שער ציון',
        'zion gate',
        'צידון',
        'התערוכה',
        'נמל הנביא',
        'מיכה',
        'סמטת מיכה',
        'tel aviv port',
        'the port'
      ] 
    },
    { 
      value: 'תל_ברוך', 
      label: 'תל ברוך', 
      aliases: [
        'תל ברוך צפון',
        'תל ברוך דרום',
        'tel baruch'
      ] 
    },
    { 
      value: 'דרום_תל_אביב', 
      label: 'דרום תל אביב', 
      aliases: [
        'שפירא', 
        'נווה שאנן',
        'נוה שאנן', 
        'התקווה', 
        'שכונת התקווה', 
        'כפר שלם', 
        'יד אליהו',
        'south tel aviv',
        'שפירא, נחלת יצחק',
        'נחלת יצחק, שפירא'
      ] 
    },
    { 
      value: 'אזורי_חן', 
      label: 'אזורי חן', 
      aliases: [
        'אזורי חן, גימל החדשה',
        'גימל החדשה'
      ] 
    },
    { 
      value: 'נווה_אביבים', 
      label: 'נווה אביבים', 
      aliases: [
        'נוה אביבים',
        'neve avivim'
      ] 
    },
    { 
      value: 'הדר_יוסף', 
      label: 'הדר יוסף', 
      aliases: [
        'hadar yosef'
      ] 
    },
    { 
      value: 'נווה_שרת', 
      label: 'נווה שרת', 
      aliases: [
        'נוה שרת',
        'neve sharet',
        'נווה שרת, עזרא ונחמיה',
        'נוה שרת, עזרא ונחמיה'
      ] 
    },
    { 
      value: 'נחלת_יצחק', 
      label: 'נחלת יצחק', 
      aliases: [
        'נחלת יצחק, שפירא',
        'nachlat yitzhak'
      ] 
    },
    { 
      value: 'יד_אליהו', 
      label: 'יד אליהו', 
      aliases: [
        'yad eliyahu',
        'איצטדיון רמת גן'
      ] 
    },
  ],
  'רמת גן': [
    { value: 'מרכז_רמת_גן', label: 'מרכז רמת גן', aliases: ['מרכז העיר רמת גן'] },
    { value: 'בורסה', label: 'אזור הבורסה', aliases: ['יהודה המכבי', 'הבורסה'] },
    { value: 'רמת_חן', label: 'רמת חן', aliases: [] },
    { value: 'תל_בנימין', label: 'תל בנימין', aliases: [] },
    { value: 'נחלת_גנים', label: 'נחלת גנים', aliases: [] },
  ],
  'גבעתיים': [
    { value: 'מרכז_גבעתיים', label: 'מרכז גבעתיים', aliases: [] },
    { value: 'בורוכוב', label: 'בורוכוב', aliases: [] },
  ],
  'הרצליה': [
    { value: 'הרצליה_פיתוח', label: 'הרצליה פיתוח', aliases: ['פיתוח'] },
    { value: 'מרכז_הרצליה', label: 'מרכז הרצליה', aliases: [] },
  ],
};

// City name normalization mapping
export const CITY_ALIASES: Record<string, string[]> = {
  'תל אביב יפו': ['תל אביב', 'תל-אביב', 'תל אביב-יפו', 'ת"א', 'tel aviv', 'telaviv'],
  'רמת גן': ['רמת-גן', 'ramat gan'],
  'גבעתיים': ['גבעת יים', 'givatayim'],
  'הרצליה': ['herzliya'],
  'ראשון לציון': ['ראשל"צ', 'ראשון-לציון', 'rishon lezion'],
  'פתח תקווה': ['פ"ת', 'פתח-תקווה', 'petach tikva'],
};

// Find neighborhood config by its value, label, or aliases
export function getNeighborhoodConfig(searchValue: string, city?: string): Neighborhood | null {
  const citiesToSearch = city ? [city] : Object.keys(NEIGHBORHOODS);
  const normalizedSearch = searchValue.trim().toLowerCase();
  
  for (const cityKey of citiesToSearch) {
    const neighborhoods = NEIGHBORHOODS[cityKey];
    if (neighborhoods) {
      // 1. Try exact value match first
      let found = neighborhoods.find(n => n.value === searchValue);
      if (found) return found;
      
      // 2. Try label match (case-insensitive)
      found = neighborhoods.find(n => n.label.toLowerCase() === normalizedSearch);
      if (found) return found;
      
      // 3. Try alias match (case-insensitive, partial match)
      found = neighborhoods.find(n => 
        n.aliases.some(alias => 
          alias.toLowerCase() === normalizedSearch ||
          normalizedSearch.includes(alias.toLowerCase()) ||
          alias.toLowerCase().includes(normalizedSearch)
        )
      );
      if (found) return found;
    }
  }
  return null;
}

// Normalize text for fuzzy matching - removes punctuation, extra spaces, double vavs
function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[,\-–—׳'״"]/g, ' ')  // Replace punctuation with spaces
    .replace(/\s+/g, ' ')          // Multiple spaces to single
    .replace(/וו/g, 'ו')           // Double vav to single
    .trim();
}

// Extract street name from address (remove house number and everything after)
export function extractStreetName(address: string): string {
  if (!address) return '';
  // Remove numbers and everything after them
  return address.replace(/[0-9].*$/, '').trim();
}

// Extract house number from address
export function extractHouseNumber(address: string): number | null {
  if (!address) return null;
  const match = address.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Match a property neighborhood string against lead's selected neighborhoods
export function matchNeighborhood(propertyNeighborhood: string, leadNeighborhoods: string[], city: string): boolean {
  if (!propertyNeighborhood || !leadNeighborhoods?.length) return false;
  
  const normalizedProperty = normalizeText(propertyNeighborhood);
  
  // Normalize city name
  let normalizedCity = city;
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    if (city === canonical || aliases.some(a => city.toLowerCase().includes(a.toLowerCase()))) {
      normalizedCity = canonical;
      break;
    }
  }
  
  for (const leadNeighborhood of leadNeighborhoods) {
    // Get the neighborhood config by the lead's selection (which is the value)
    const config = getNeighborhoodConfig(leadNeighborhood, normalizedCity);
    
    if (config) {
      const normalizedLabel = normalizeText(config.label);
      
      // Check if property neighborhood matches the label
      if (normalizedProperty.includes(normalizedLabel) || normalizedLabel.includes(normalizedProperty)) {
        return true;
      }
      
      // Check if property neighborhood matches any alias (with normalization)
      for (const alias of config.aliases) {
        const normalizedAlias = normalizeText(alias);
        if (normalizedProperty.includes(normalizedAlias) ||
            normalizedAlias.includes(normalizedProperty)) {
          return true;
        }
      }
    }
    
    // No fallback - only match via configured neighborhoods
    // Direct string matching removed to prevent false positives
  }
  
  return false;
}
