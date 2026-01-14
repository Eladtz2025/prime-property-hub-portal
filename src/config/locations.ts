// Central configuration for cities and neighborhoods
// This file is used for both form selection and matching logic

export interface City {
  value: string;
  label: string;
}

export interface Neighborhood {
  value: string;
  label: string;
  aliases: string[];
}

export const CITIES: City[] = [
  { value: 'תל אביב יפו', label: 'תל אביב' },
  { value: 'רמת גן', label: 'רמת גן' },
  { value: 'גבעתיים', label: 'גבעתיים' },
  { value: 'הרצליה', label: 'הרצליה' },
  { value: 'רעננה', label: 'רעננה' },
  { value: 'פתח תקווה', label: 'פתח תקווה' },
  { value: 'ראשון לציון', label: 'ראשון לציון' },
  { value: 'חולון', label: 'חולון' },
  { value: 'בת ים', label: 'בת ים' },
  { value: 'נתניה', label: 'נתניה' },
  { value: 'בני ברק', label: 'בני ברק' },
  { value: 'כפר סבא', label: 'כפר סבא' },
  { value: 'הוד השרון', label: 'הוד השרון' },
  { value: 'רמת השרון', label: 'רמת השרון' },
  { value: 'אשדוד', label: 'אשדוד' },
  { value: 'אשקלון', label: 'אשקלון' },
];

// City name normalization mapping
export const CITY_ALIASES: Record<string, string[]> = {
  'תל אביב יפו': ['תל אביב', 'תל-אביב', 'תל אביב-יפו', 'ת"א', 'tel aviv', 'telaviv'],
  'רמת גן': ['רמת-גן', 'ramat gan'],
  'גבעתיים': ['גבעת יים', 'givatayim'],
  'הרצליה': ['herzliya'],
  'ראשון לציון': ['ראשל"צ', 'ראשון-לציון', 'rishon lezion'],
  'פתח תקווה': ['פ"ת', 'פתח-תקווה', 'petach tikva'],
};

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
        'צפון הישן / צפון החדש',
        'צפון החדש / צפון הישן'
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
        'יהודה המכבי, הצפון החדש - צפון'
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
        'לב תל אביב החלק המערבי',
        'מרכז',
        'center'
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
        'kikar hamedina'
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
        'neve sharet'
      ] 
    },
    { 
      value: 'אחר_תא', 
      label: 'אחר', 
      aliases: [] 
    },
  ],
  'רמת גן': [
    { 
      value: 'מרכז_רמת_גן', 
      label: 'מרכז רמת גן', 
      aliases: ['מרכז העיר רמת גן'] 
    },
    { 
      value: 'בורסה', 
      label: 'אזור הבורסה', 
      aliases: ['יהודה המכבי', 'הבורסה'] 
    },
    { 
      value: 'רמת_חן', 
      label: 'רמת חן', 
      aliases: [] 
    },
    { 
      value: 'תל_בנימין', 
      label: 'תל בנימין', 
      aliases: [] 
    },
    { 
      value: 'נחלת_גנים', 
      label: 'נחלת גנים', 
      aliases: [] 
    },
    { 
      value: 'אחר_רג', 
      label: 'אחר', 
      aliases: [] 
    },
  ],
  'גבעתיים': [
    { 
      value: 'מרכז_גבעתיים', 
      label: 'מרכז גבעתיים', 
      aliases: [] 
    },
    { 
      value: 'בורוכוב', 
      label: 'בורוכוב', 
      aliases: [] 
    },
    { 
      value: 'אחר_גבעתיים', 
      label: 'אחר', 
      aliases: [] 
    },
  ],
  'הרצליה': [
    { 
      value: 'הרצליה_פיתוח', 
      label: 'הרצליה פיתוח', 
      aliases: ['פיתוח'] 
    },
    { 
      value: 'מרכז_הרצליה', 
      label: 'מרכז הרצליה', 
      aliases: [] 
    },
    { 
      value: 'אחר_הרצליה', 
      label: 'אחר', 
      aliases: [] 
    },
  ],
};

// Helper function to find a neighborhood by its value or alias
export function findNeighborhoodByAlias(cityValue: string, searchTerm: string): Neighborhood | null {
  const cityNeighborhoods = NEIGHBORHOODS[cityValue];
  if (!cityNeighborhoods) return null;
  
  const normalizedSearch = searchTerm.trim().toLowerCase();
  
  for (const neighborhood of cityNeighborhoods) {
    // Check label
    if (neighborhood.label.toLowerCase() === normalizedSearch) {
      return neighborhood;
    }
    
    // Check value
    if (neighborhood.value.toLowerCase() === normalizedSearch) {
      return neighborhood;
    }
    
    // Check aliases
    for (const alias of neighborhood.aliases) {
      if (alias.toLowerCase() === normalizedSearch || 
          normalizedSearch.includes(alias.toLowerCase()) ||
          alias.toLowerCase().includes(normalizedSearch)) {
        return neighborhood;
      }
    }
  }
  
  return null;
}

// Helper function to match a property neighborhood to lead's preferred neighborhoods
export function matchNeighborhood(propertyNeighborhood: string, leadNeighborhoods: string[], city: string): boolean {
  if (!propertyNeighborhood || !leadNeighborhoods?.length) return false;
  
  const normalizedPropertyNeighborhood = propertyNeighborhood.trim().toLowerCase();
  
  for (const leadNeighborhood of leadNeighborhoods) {
    // First try to find the neighborhood config by the lead's selection
    const cityNeighborhoods = NEIGHBORHOODS[city] || NEIGHBORHOODS['תל אביב יפו'];
    
    if (cityNeighborhoods) {
      const config = cityNeighborhoods.find(n => n.value === leadNeighborhood);
      
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
    }
    
    // No fallback - only match via configured neighborhoods
  }
  
  return false;
}
