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
        'צפון הישן / צפון החדש'
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
        'new north',
        'צפון החדש',
        'לואי מרשל',
        'louis marshall'
      ] 
    },
    { 
      value: 'מרכז_העיר', 
      label: 'מרכז העיר', 
      aliases: [
        'לב העיר', 
        'לב תל אביב', 
        'לב העיר צפון',
        'לב תל אביב החלק המערבי',
        'מרכז',
        'center',
        'לב העיר דרום',
        'לבהעיר'
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
        'נוה צדק'
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
        'סביבת כיכר המדינה',
        'kikar hamedina'
      ] 
    },
    { 
      value: 'רמת_אביב', 
      label: 'רמת אביב', 
      aliases: [
        'רמת אביב החדשה', 
        'רמת אביב ג', 
        'נופי ים', 
        'הגוש הגדול',
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
        'tzahala'
      ] 
    },
    { 
      value: 'בבלי', 
      label: 'בבלי', 
      aliases: [
        'שיכון בבלי',
        'bavli'
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
        'התקווה', 
        'שכונת התקווה', 
        'כפר שלם', 
        'יד אליהו',
        'south tel aviv'
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

// Match a property neighborhood string against lead's selected neighborhoods
export function matchNeighborhood(propertyNeighborhood: string, leadNeighborhoods: string[], city: string): boolean {
  if (!propertyNeighborhood || !leadNeighborhoods?.length) return false;
  
  const normalizedPropertyNeighborhood = propertyNeighborhood.trim().toLowerCase();
  
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
      // Check if property neighborhood matches the label
      if (normalizedPropertyNeighborhood.includes(config.label.toLowerCase())) {
        return true;
      }
      
      // Check if property neighborhood matches any alias
      for (const alias of config.aliases) {
        if (normalizedPropertyNeighborhood.includes(alias.toLowerCase()) ||
            alias.toLowerCase().includes(normalizedPropertyNeighborhood)) {
          return true;
        }
      }
    }
    
    // No fallback - only match via configured neighborhoods
    // Direct string matching removed to prevent false positives
  }
  
  return false;
}
