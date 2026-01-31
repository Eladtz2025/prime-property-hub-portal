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
      value: 'יד_אליהו', 
      label: 'יד אליהו', 
      aliases: [
        'yad eliyahu',
        'בלומפילד',
        'אצטדיון בלומפילד'
      ] 
    },
    { 
      value: 'רמת_החייל', 
      label: 'רמת החייל', 
      aliases: [
        'ramat hachayal',
        'רמת החיל',
        'ramat hahayal'
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

// NOTE: The matchNeighborhood function has been removed from this file.
// All property-to-lead matching is now done in the Edge Functions:
// - supabase/functions/_shared/matching.ts - main matching logic
// - supabase/functions/_shared/locations.ts - neighborhood matching with street lookups
// The street_neighborhoods database table is used for address-based neighborhood resolution.

// Source-specific neighborhoods - displayed EXACTLY as they appear on each site
// Some sites (like Homeless) only support broad areas, not specific neighborhoods
export const SOURCE_NEIGHBORHOODS: Record<string, Record<string, Neighborhood[]>> = {
  // Homeless only supports 6 broad areas for Tel Aviv (not specific neighborhoods!)
  // These are displayed exactly as they appear on homeless.co.il
  homeless: {
    'תל אביב יפו': [
      { value: 'homeless_תא_מרכז', label: 'תל-אביב מרכז', aliases: [] },
      { value: 'homeless_תא_דרום', label: 'תל-אביב דרום', aliases: [] },
      { value: 'homeless_תא_צפון', label: 'תל-אביב צפון', aliases: [] },
      { value: 'homeless_תא_מזרח', label: 'תל-אביב מזרח', aliases: [] },
      { value: 'homeless_תא_צפון_ירקון', label: 'ת"א צפונית לירקון', aliases: [] },
      { value: 'homeless_יפו', label: 'יפו', aliases: [] },
    ],
  },
  // Yad2 and Madlan continue to use the existing NEIGHBORHOODS (no specific mapping needed)
};
