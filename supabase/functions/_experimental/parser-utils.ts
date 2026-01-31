/**
 * Shared utility functions for non-AI property parsing
 * 
 * EXPERIMENTAL - Completely isolated from production code
 * This file contains helper functions for extracting data from HTML
 */

// ============================================
// Price Extraction
// ============================================

/**
 * Extract numeric price from Hebrew text
 * Handles: "₪8,500", "8500 ש"ח", "8,500", etc.
 */
export function extractPrice(text: string): number | null {
  if (!text) return null;
  
  // Remove currency symbols and common Hebrew price terms
  const cleaned = text
    .replace(/[₪$€]/g, '')
    .replace(/ש"ח|שקל|שקלים/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim();
  
  // Extract first number sequence
  const match = cleaned.match(/(\d+)/);
  if (!match) return null;
  
  const price = parseInt(match[1], 10);
  
  // Sanity check - prices should be reasonable
  if (price < 500 || price > 100000000) return null;
  
  return price;
}

// ============================================
// Rooms Extraction
// ============================================

/**
 * Extract room count from Hebrew text
 * Handles: "3 חד׳", "3.5 חדרים", "4 חד'", etc.
 * MUST have room suffix to avoid false positives from prices/addresses
 */
export function extractRooms(text: string): number | null {
  if (!text) return null;
  
  // Must have number followed by room indicator (חד׳, חדרים, חד')
  const match = text.match(/(\d+(?:[.,]\d)?)\s*(?:חד[׳']|חדרים)/);
  if (!match) return null;
  
  const rooms = parseFloat(match[1].replace(',', '.'));
  
  // Sanity check - rooms should be 1-20
  if (rooms < 1 || rooms > 20) return null;
  
  return rooms;
}

// ============================================
// Size Extraction
// ============================================

/**
 * Extract size in sqm from Hebrew text
 * Handles: "75 מ"ר", "75 מטר", "75m²", etc.
 * MUST have size suffix to avoid false positives from addresses
 */
export function extractSize(text: string): number | null {
  if (!text) return null;
  
  // Must have number followed by size indicator (מ"ר, מ״ר, מטר, m², sqm)
  const match = text.match(/(\d+)\s*(?:מ"ר|מ״ר|מטר|m²|sqm)/i);
  if (!match) return null;
  
  const size = parseInt(match[1], 10);
  
  // Sanity check - size should be 10-2000 sqm
  if (size < 10 || size > 2000) return null;
  
  return size;
}

// ============================================
// Floor Extraction
// ============================================

/**
 * Extract floor number from Hebrew text
 * Handles: "קומה 3", "קומת קרקע", "קומה -1", etc.
 * MUST have floor indicator to avoid false positives
 */
export function extractFloor(text: string): number | null {
  if (!text) return null;
  
  // Debug: Log input with special char codes
  if (text.includes('קרקע')) {
    console.log(`[extractFloor] Found קרקע in text: "${text.substring(0, 60)}"`);
    console.log(`[extractFloor] Regex test result: ${/קומת?\s*קרקע/.test(text)}`);
  }
  
  // Ground floor variations (Hebrew doesn't need toLowerCase)
  if (/קומת?\s*קרקע|קרקע/.test(text)) return 0;
  if (/ground|גראונד/i.test(text)) return 0;
  
  // Basement variations
  if (/מרתף|basement/i.test(text)) return -1;
  
  // Must have "קומה X" pattern
  const match = text.match(/קומה\s*(-?\d+)/);
  if (!match) return null;
  
  const floor = parseInt(match[1], 10);
  
  // Sanity check - floors should be -5 to 100
  if (floor < -5 || floor > 100) return null;
  
  return floor;
}

// ============================================
// City Extraction
// ============================================

// Canonical city names (matching locations.ts)
const CITY_PATTERNS: Array<{ pattern: RegExp; canonical: string }> = [
  // Main cities (original)
  { pattern: /תל\s*[-]?\s*אביב(?:\s*[-]?\s*יפו)?|ת"א/i, canonical: 'תל אביב יפו' },
  { pattern: /רמת\s*[-]?\s*גן/i, canonical: 'רמת גן' },
  { pattern: /גבעתיים|גבעת\s*יים/i, canonical: 'גבעתיים' },
  { pattern: /הרצליה/i, canonical: 'הרצליה' },
  { pattern: /רעננה/i, canonical: 'רעננה' },
  { pattern: /פתח\s*[-]?\s*תקו?וה|פ"ת/i, canonical: 'פתח תקווה' },
  { pattern: /ראשון\s*[-]?\s*לציון|ראשל"צ/i, canonical: 'ראשון לציון' },
  { pattern: /חולון/i, canonical: 'חולון' },
  { pattern: /בת\s*[-]?\s*ים/i, canonical: 'בת ים' },
  { pattern: /נתניה/i, canonical: 'נתניה' },
  { pattern: /בני\s*[-]?\s*ברק/i, canonical: 'בני ברק' },
  { pattern: /כפר\s*[-]?\s*סבא/i, canonical: 'כפר סבא' },
  { pattern: /הוד\s*[-]?\s*השרון/i, canonical: 'הוד השרון' },
  { pattern: /רמת\s*[-]?\s*השרון/i, canonical: 'רמת השרון' },
  { pattern: /אשדוד/i, canonical: 'אשדוד' },
  { pattern: /אשקלון/i, canonical: 'אשקלון' },
  
  // Additional cities (common in Homeless)
  { pattern: /ירושלים/i, canonical: 'ירושלים' },
  { pattern: /חיפה/i, canonical: 'חיפה' },
  { pattern: /באר\s*[-]?\s*שבע/i, canonical: 'באר שבע' },
  { pattern: /קרית\s*[-]?\s*מוצקין/i, canonical: 'קרית מוצקין' },
  { pattern: /קרית\s*[-]?\s*ביאליק/i, canonical: 'קרית ביאליק' },
  { pattern: /קרית\s*[-]?\s*אתא/i, canonical: 'קרית אתא' },
  { pattern: /קרית\s*[-]?\s*ים/i, canonical: 'קרית ים' },
  { pattern: /קרית\s*[-]?\s*גת/i, canonical: 'קרית גת' },
  { pattern: /טבריה/i, canonical: 'טבריה' },
  { pattern: /אילת/i, canonical: 'אילת' },
  { pattern: /חדרה/i, canonical: 'חדרה' },
  { pattern: /מודיעין/i, canonical: 'מודיעין' },
  { pattern: /נס\s*[-]?\s*ציונה/i, canonical: 'נס ציונה' },
  { pattern: /יבנה/i, canonical: 'יבנה' },
  { pattern: /לוד/i, canonical: 'לוד' },
  { pattern: /רמלה/i, canonical: 'רמלה' },
  { pattern: /עפולה/i, canonical: 'עפולה' },
  { pattern: /נהריה/i, canonical: 'נהריה' },
  { pattern: /עכו/i, canonical: 'עכו' },
  { pattern: /נשר/i, canonical: 'נשר' },
  { pattern: /טירת\s*[-]?\s*כרמל/i, canonical: 'טירת כרמל' },
  { pattern: /גבעת\s*[-]?\s*שמואל/i, canonical: 'גבעת שמואל' },
  { pattern: /רחובות/i, canonical: 'רחובות' },
  { pattern: /קדימה|צורן/i, canonical: 'קדימה צורן' },
  { pattern: /דאלית\s*אל[-]?\s*כרמל/i, canonical: 'דאלית אל כרמל' },
  { pattern: /עראבה/i, canonical: 'עראבה' },
  { pattern: /סח'נין|סכנין/i, canonical: 'סכנין' },
  { pattern: /אום\s*אל[-]?\s*פחם/i, canonical: 'אום אל פחם' },
  { pattern: /נצרת/i, canonical: 'נצרת' },
  { pattern: /צפת/i, canonical: 'צפת' },
  { pattern: /עראד/i, canonical: 'ערד' },
  { pattern: /דימונה/i, canonical: 'דימונה' },
];

/**
 * Extract and normalize city name from address text
 */
export function extractCity(text: string): string | null {
  if (!text) return null;
  
  for (const { pattern, canonical } of CITY_PATTERNS) {
    if (pattern.test(text)) {
      return canonical;
    }
  }
  
  return null;
}

// ============================================
// Neighborhood Extraction
// ============================================

// Tel Aviv neighborhoods (most common, matching locations.ts)
const TEL_AVIV_NEIGHBORHOODS: Array<{ pattern: RegExp; value: string; label: string }> = [
  { pattern: /צפון\s*(?:ה)?ישן|הצפון\s*הישן|old\s*north/i, value: 'צפון_ישן', label: 'צפון ישן' },
  { pattern: /צפון\s*(?:ה)?חדש|הצפון\s*החדש|new\s*north/i, value: 'צפון_חדש', label: 'צפון חדש' },
  { pattern: /מרכז\s*(?:ה)?עיר|לב\s*(?:ה)?עיר|לב\s*תל\s*אביב/i, value: 'מרכז_העיר', label: 'מרכז העיר' },
  { pattern: /פלורנטין/i, value: 'פלורנטין', label: 'פלורנטין' },
  { pattern: /נו?ו?ה?\s*צדק/i, value: 'נווה_צדק', label: 'נווה צדק' },
  { pattern: /רוטשילד|שרונה|מונטיפיורי/i, value: 'רוטשילד', label: 'רוטשילד' },
  { pattern: /כרם\s*(?:ה)?תימנים/i, value: 'כרם_התימנים', label: 'כרם התימנים' },
  { pattern: /כיכר\s*(?:ה)?מדינה/i, value: 'כיכר_המדינה', label: 'כיכר המדינה' },
  { pattern: /רמת\s*אביב\s*(?:ה)?חדשה/i, value: 'רמת_אביב_החדשה', label: 'רמת אביב החדשה' },
  { pattern: /רמת\s*אביב\s*(?:ה)?ישנה/i, value: 'רמת_אביב', label: 'רמת אביב' },
  { pattern: /רמת\s*אביב/i, value: 'רמת_אביב', label: 'רמת אביב' },
  { pattern: /יפו|עג'מי|ajami/i, value: 'יפו', label: 'יפו' },
  { pattern: /צהלה|גני\s*צהלה/i, value: 'צהלה', label: 'צהלה' },
  { pattern: /בבלי/i, value: 'בבלי', label: 'בבלי' },
  { pattern: /נמל|הנמל|יורדי\s*הסירה/i, value: 'נמל_תל_אביב', label: 'נמל תל אביב' },
  { pattern: /תל\s*ברוך/i, value: 'תל_ברוך', label: 'תל ברוך' },
  { pattern: /אזורי\s*חן/i, value: 'אזורי_חן', label: 'אזורי חן' },
  { pattern: /נו?ו?ה?\s*אביבים/i, value: 'נווה_אביבים', label: 'נווה אביבים' },
  { pattern: /הדר\s*יוסף/i, value: 'הדר_יוסף', label: 'הדר יוסף' },
  { pattern: /נו?ו?ה?\s*שרת/i, value: 'נווה_שרת', label: 'נווה שרת' },
  // Additional Tel Aviv neighborhoods
  { pattern: /אפקה/i, value: 'אפקה', label: 'אפקה' },
  { pattern: /קרית\s*שלום/i, value: 'קרית_שלום', label: 'קרית שלום' },
  { pattern: /שכונת\s*(?:ה)?תקווה|התקווה/i, value: 'התקווה', label: 'שכונת התקווה' },
  { pattern: /שפירא/i, value: 'שפירא', label: 'שפירא' },
  { pattern: /נו?ו?ה?\s*שאנן/i, value: 'נווה_שאנן', label: 'נווה שאנן' },
  { pattern: /כפר\s*שלם/i, value: 'כפר_שלם', label: 'כפר שלם' },
  { pattern: /יד\s*אליהו/i, value: 'יד_אליהו', label: 'יד אליהו' },
  { pattern: /נו?ו?ה?\s*עופר/i, value: 'נווה_עופר', label: 'נווה עופר' },
  { pattern: /הצפון\s*הישן\s*(?:ה)?חדש/i, value: 'צפון_ישן_החדש', label: 'צפון ישן החדש' },
  { pattern: /לב\s*העיר/i, value: 'לב_העיר', label: 'לב העיר' },
  { pattern: /גבעת\s*עמל/i, value: 'גבעת_עמל', label: 'גבעת עמל' },
  { pattern: /קו\s*(?:ה)?ים/i, value: 'קו_הים', label: 'קו הים' },
  { pattern: /נחלת\s*יצחק/i, value: 'נחלת_יצחק', label: 'נחלת יצחק' },
  { pattern: /מונטיפיורי/i, value: 'מונטיפיורי', label: 'מונטיפיורי' },
];

// Ramat Gan neighborhoods
const RAMAT_GAN_NEIGHBORHOODS: Array<{ pattern: RegExp; value: string; label: string }> = [
  { pattern: /בורסה|יהודה\s*המכבי/i, value: 'בורסה', label: 'אזור הבורסה' },
  { pattern: /רמת\s*חן/i, value: 'רמת_חן', label: 'רמת חן' },
  { pattern: /תל\s*בנימין/i, value: 'תל_בנימין', label: 'תל בנימין' },
  { pattern: /נחלת\s*גנים/i, value: 'נחלת_גנים', label: 'נחלת גנים' },
];

// Herzliya neighborhoods
const HERZLIYA_NEIGHBORHOODS: Array<{ pattern: RegExp; value: string; label: string }> = [
  { pattern: /פיתוח|הרצליה\s*פיתוח/i, value: 'הרצליה_פיתוח', label: 'הרצליה פיתוח' },
];

/**
 * Extract neighborhood from address text based on city
 */
export function extractNeighborhood(text: string, city: string | null): { value: string; label: string } | null {
  if (!text) return null;
  
  let neighborhoods: Array<{ pattern: RegExp; value: string; label: string }> = [];
  
  switch (city) {
    case 'תל אביב יפו':
      neighborhoods = TEL_AVIV_NEIGHBORHOODS;
      break;
    case 'רמת גן':
      neighborhoods = RAMAT_GAN_NEIGHBORHOODS;
      break;
    case 'הרצליה':
      neighborhoods = HERZLIYA_NEIGHBORHOODS;
      break;
    default:
      // Try all neighborhoods
      neighborhoods = [...TEL_AVIV_NEIGHBORHOODS, ...RAMAT_GAN_NEIGHBORHOODS, ...HERZLIYA_NEIGHBORHOODS];
  }
  
  for (const { pattern, value, label } of neighborhoods) {
    if (pattern.test(text)) {
      return { value, label };
    }
  }
  
  return null;
}

// ============================================
// Broker Detection
// ============================================

/**
 * Strong broker keywords - these definitely indicate a broker listing
 * Based on actual site screenshots:
 * - Madlan: Shows "תיווך" + 7-digit license number
 * - Yad2: Shows "תיווך:" + license number  
 * - Homeless: Shows "שם הסוכנות:" with agency name
 */
const STRONG_BROKER_KEYWORDS = [
  'תיווך',           // Explicit broker label (Madlan, Yad2)
  'בבלעדיות',        // Exclusivity (broker indicator)
  'מתווך',           // Broker (masculine)
  'מתווכת',          // Broker (feminine)
  'רישיון',          // License (broker registration)
  'שם הסוכנות',      // Agency name field (Homeless)
];

/**
 * Known broker brand names (case-insensitive matching)
 */
const BROKER_BRANDS = [
  'רימקס', 're/max', 'remax',
  'אנגלו סכסון', 'anglo saxon',
  'century 21', 'century21',
  'קולדוול בנקר', 'coldwell banker',
];

/**
 * Detect if listing is from a broker
 * Uses ONLY strong indicators to avoid false positives from generic words
 * like "נכסים" or "Properties" that appear in site navigation
 */
export function detectBroker(text: string): boolean {
  if (!text) return false;
  const textLower = text.toLowerCase();
  
  // 1. Check for strong broker keywords
  if (STRONG_BROKER_KEYWORDS.some(k => text.includes(k))) {
    return true;
  }
  
  // 2. Check for known broker brands
  if (BROKER_BRANDS.some(brand => textLower.includes(brand.toLowerCase()))) {
    return true;
  }
  
  // 3. Check for 7-digit license number (Israeli broker license format)
  if (/\d{7}/.test(text)) {
    return true;
  }
  
  return false;
}

// ============================================
// Text Cleaning
// ============================================

/**
 * Clean and normalize Hebrew text
 */
export function cleanText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
    .trim();
}

/**
 * Generate a unique source ID from URL or content
 */
export function generateSourceId(source: string, url: string, index: number): string {
  // Try to extract ID from URL
  const urlMatch = url.match(/\/(\d+)(?:\/|$|\?)/);
  if (urlMatch) {
    return `${source}-${urlMatch[1]}`;
  }
  
  // Fallback to hash-based ID
  const hash = simpleHash(url + index);
  return `${source}-${hash}`;
}

/**
 * Simple string hash for ID generation
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================
// Date Parsing
// ============================================

const HEBREW_MONTHS: Record<string, number> = {
  'ינואר': 1, 'פברואר': 2, 'מרץ': 3, 'אפריל': 4,
  'מאי': 5, 'יוני': 6, 'יולי': 7, 'אוגוסט': 8,
  'ספטמבר': 9, 'אוקטובר': 10, 'נובמבר': 11, 'דצמבר': 12
};

/**
 * Parse Hebrew date string to ISO format
 * Handles: "15/01/2024", "15.01.2024", "15 ינואר 2024"
 */
export function parseHebrewDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Try DD/MM/YYYY or DD.MM.YYYY
  const slashMatch = dateStr.match(/(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try "DD Month YYYY" in Hebrew
  for (const [monthName, monthNum] of Object.entries(HEBREW_MONTHS)) {
    const regex = new RegExp(`(\\d{1,2})\\s*${monthName}\\s*(\\d{4})`, 'i');
    const match = dateStr.match(regex);
    if (match) {
      const [, day, year] = match;
      return `${year}-${monthNum.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return null;
}

// ============================================
// Features Extraction
// ============================================

export interface PropertyFeatures {
  balcony?: boolean;
  parking?: boolean;
  elevator?: boolean;
  mamad?: boolean;     // Safe room
  storage?: boolean;   // מחסן
  aircon?: boolean;    // מזגן
  furnished?: boolean; // מרוהטת
  renovated?: boolean; // משופצת
  yard?: boolean;      // חצר/גינה
  roof?: boolean;      // גג
  accessible?: boolean; // נגיש
}

/**
 * Extract property features from Hebrew text
 * Looks for keywords indicating amenities
 */
/**
 * Extract property features from a single property block text
 * This function is used by parsers that already isolate individual property blocks,
 * so the patterns can be simpler than the backfill version
 */
export function extractFeatures(text: string): PropertyFeatures {
  if (!text) return {};
  
  const features: PropertyFeatures = {};
  
  // Balcony patterns (מרפסת)
  if (/מרפסת/.test(text)) {
    features.balcony = true;
  }
  
  // Parking patterns (חניה)
  if (/חניה|חנייה|מקום\s*חניה/.test(text)) {
    features.parking = true;
  }
  
  // Elevator patterns (מעלית)
  if (/מעלית/.test(text)) {
    features.elevator = true;
  }
  
  // Mamad / Safe room patterns (ממ"ד)
  if (/ממ"?ד|מרחב\s*מוגן/.test(text)) {
    features.mamad = true;
  }
  
  // Storage patterns (מחסן)
  if (/\bמחסן\b/.test(text)) {
    features.storage = true;
  }
  
  // Air conditioning patterns (מזגן)
  if (/מזגנ?|מיזוג/.test(text)) {
    features.aircon = true;
  }
  
  // Furnished patterns (מרוהטת)
  if (/מרוהט/.test(text)) {
    features.furnished = true;
  }
  
  // Renovated patterns (משופצת) - more specific to avoid "חדש" false positives
  if (/משופצ|שופץ|לאחר\s*שיפוץ/.test(text)) {
    features.renovated = true;
  }
  
  // Yard/Garden patterns (חצר/גינה)
  if (/חצר|גינה|גן\s*פרטי|דירת\s*גן/.test(text)) {
    features.yard = true;
  }
  
  // Roof/Penthouse patterns (גג) - more specific
  if (/גג\s*(פרטי|צמוד)?|פנטהאו[זס]|דירת\s*גג/.test(text)) {
    features.roof = true;
  }
  
  // Accessible patterns (נגיש) - more specific  
  if (/נגיש\s*(ל?נכים)?|נגישות/.test(text)) {
    features.accessible = true;
  }
  
  // Pets allowed (חיות מחמד)
  if (/מותר\s*(חיות|בע"ח)|pet\s*friendly/i.test(text)) {
    features.pets = true;
  }
  
  return features;
}

/**
 * Merge multiple feature objects (for when features appear in different parts of the listing)
 */
export function mergeFeatures(...featureSets: PropertyFeatures[]): PropertyFeatures {
  const merged: PropertyFeatures = {};
  
  for (const features of featureSets) {
    if (!features) continue;
    for (const [key, value] of Object.entries(features)) {
      if (value === true) {
        (merged as any)[key] = true;
      }
    }
  }
  
  return merged;
}

// ============================================
// Parsed Property Interface
// ============================================

export interface ParsedProperty {
  source: string;
  source_id: string;
  source_url: string;
  title: string | null;
  city: string;
  neighborhood: string | null;
  neighborhood_value: string | null;
  address: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  floor: number | null;
  property_type: 'rent' | 'sale';
  is_private: boolean;
  entry_date: string | null;
  features?: PropertyFeatures;
  raw_text?: string; // For debugging
  raw_data?: any;
}

export interface ParserResult {
  success: boolean;
  properties: ParsedProperty[];
  stats: {
    total_found: number;
    with_price: number;
    with_rooms: number;
    with_address: number;
    with_size: number;
    with_floor: number;
    private_count: number;
    broker_count: number;
  };
  errors: string[];
}
