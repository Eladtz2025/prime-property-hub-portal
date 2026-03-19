/**
 * Madlan HTML Parser (Direct Fetch)
 * 
 * Parses property listings from Madlan's SSR HTML response.
 * Uses `data-auto` attributes for reliable extraction:
 * - data-auto="listed-bulletin" + data-auto-bulletin-id → listing container
 * - data-auto="property-price" → price
 * - data-auto="property-rooms" → rooms
 * - data-auto="property-floor" → floor
 * - data-auto="property-size" → size
 * - data-auto="property-address" → address
 * - href="/listings/XXX" → source URL
 */

import { 
  extractPrice, 
  extractRooms, 
  extractSize, 
  extractFloor,
  extractNeighborhood,
  extractFeatures,
  type ParsedProperty,
  type ParserResult,
} from './parser-utils.ts';

// ============================================
// Known Tel Aviv neighborhoods (reused from parser-madlan.ts)
// ============================================

const KNOWN_NEIGHBORHOODS = [
  { pattern: /צפון\s*(?:ה)?ישן|הצפון\s*הישן/i, value: 'צפון_ישן', label: 'צפון ישן' },
  { pattern: /צפון\s*(?:ה)?חדש|הצפון\s*החדש/i, value: 'צפון_חדש', label: 'צפון חדש' },
  { pattern: /נמל\s*תל\s*אביב|יורדי\s*הסירה/i, value: 'נמל_תל_אביב', label: 'נמל תל אביב' },
  { pattern: /לב\s*(?:ה)?עיר/i, value: 'לב_העיר', label: 'לב העיר' },
  { pattern: /פלורנטין/i, value: 'פלורנטין', label: 'פלורנטין' },
  { pattern: /נווה\s*צדק/i, value: 'נווה_צדק', label: 'נווה צדק' },
  { pattern: /כרם\s*(?:ה)?תימנים/i, value: 'כרם_התימנים', label: 'כרם התימנים' },
  { pattern: /רמת\s*אביב\s*(?:ה)?חדשה/i, value: 'רמת_אביב_החדשה', label: 'רמת אביב החדשה' },
  { pattern: /רמת\s*אביב\s*ג'?/i, value: 'רמת_אביב_ג', label: "רמת אביב ג'" },
  { pattern: /רמת\s*אביב/i, value: 'רמת_אביב', label: 'רמת אביב' },
  { pattern: /אפקה/i, value: 'אפקה', label: 'אפקה' },
  { pattern: /נווה\s*אביבים/i, value: 'נווה_אביבים', label: 'נווה אביבים' },
  { pattern: /יפו\s*(?:ה)?עתיקה|עג'?מי|נוגה/i, value: 'יפו', label: 'יפו' },
  { pattern: /שפירא/i, value: 'שפירא', label: 'שפירא' },
  { pattern: /מונטיפיורי/i, value: 'מונטיפיורי', label: 'מונטיפיורי' },
  { pattern: /הדר\s*יוסף/i, value: 'הדר_יוסף', label: 'הדר יוסף' },
  { pattern: /בבלי/i, value: 'בבלי', label: 'בבלי' },
  { pattern: /קרית\s*שלום/i, value: 'קרית_שלום', label: 'קרית שלום' },
  { pattern: /נוה\s*שאנן|נווה\s*שאנן/i, value: 'נווה_שאנן', label: 'נווה שאנן' },
  { pattern: /שכונת\s*התקווה/i, value: 'התקווה', label: 'שכונת התקווה' },
  { pattern: /כיכר\s*המדינה/i, value: 'כיכר_המדינה', label: 'כיכר המדינה' },
  { pattern: /לב\s*תל\s*אביב/i, value: 'לב_תל_אביב', label: 'לב תל אביב' },
  { pattern: /ביצרון/i, value: 'ביצרון', label: 'ביצרון' },
  { pattern: /נחלת\s*יצחק/i, value: 'נחלת_יצחק', label: 'נחלת יצחק' },
  { pattern: /הצפון\s*הישן/i, value: 'צפון_ישן', label: 'צפון ישן' },
];

const STREET_TO_NEIGHBORHOOD: Record<string, { value: string; label: string }> = {
  'פינסקר': { value: 'לב_העיר', label: 'לב העיר' },
  'בוגרשוב': { value: 'לב_העיר', label: 'לב העיר' },
  'אלנבי': { value: 'לב_העיר', label: 'לב העיר' },
  'שינקין': { value: 'לב_העיר', label: 'לב העיר' },
  'רוטשילד': { value: 'לב_העיר', label: 'לב העיר' },
  'הרצל': { value: 'לב_העיר', label: 'לב העיר' },
  'נחלת בנימין': { value: 'לב_העיר', label: 'לב העיר' },
  'בן יהודה': { value: 'צפון_ישן', label: 'צפון ישן' },
  'דיזנגוף': { value: 'צפון_ישן', label: 'צפון ישן' },
  'ארלוזורוב': { value: 'צפון_ישן', label: 'צפון ישן' },
  'נורדאו': { value: 'צפון_ישן', label: 'צפון ישן' },
  'גורדון': { value: 'צפון_ישן', label: 'צפון ישן' },
  'פרישמן': { value: 'צפון_ישן', label: 'צפון ישן' },
  'הירקון': { value: 'צפון_ישן', label: 'צפון ישן' },
  'ליאונרדו': { value: 'צפון_חדש', label: 'צפון חדש' },
  'שלום עליכם': { value: 'צפון_חדש', label: 'צפון חדש' },
  "ז'בוטינסקי": { value: 'צפון_חדש', label: 'צפון חדש' },
  'ויצמן': { value: 'צפון_חדש', label: 'צפון חדש' },
  'פנקס': { value: 'צפון_חדש', label: 'צפון חדש' },
  'יהודה המכבי': { value: 'צפון_חדש', label: 'צפון חדש' },
  'בלפור': { value: 'צפון_חדש', label: 'צפון חדש' },
  'איינשטיין': { value: 'רמת_אביב', label: 'רמת אביב' },
  'ברודצקי': { value: 'רמת_אביב', label: 'רמת אביב' },
  'פלורנטין': { value: 'פלורנטין', label: 'פלורנטין' },
  'סלמה': { value: 'פלורנטין', label: 'פלורנטין' },
  'שבזי': { value: 'נווה_צדק', label: 'נווה צדק' },
  'לילינבלום': { value: 'נווה_צדק', label: 'נווה צדק' },
};

// ============================================
// Main Entry Point
// ============================================

export function parseMadlanDirectHtml(
  html: string,
  propertyType: 'rent' | 'sale',
  ownerTypeFilter?: 'private' | 'broker' | null
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  console.log(`[parser-madlan-html] Input: ${html.length} chars`);
  
  // Split HTML into listing cards using data-auto="listed-bulletin"
  const cards = splitIntoCards(html);
  console.log(`[parser-madlan-html] Found ${cards.length} listing cards`);
  
  for (let i = 0; i < cards.length; i++) {
    try {
      const parsed = parseHtmlCard(cards[i], propertyType);
      if (parsed) {
        if (ownerTypeFilter === 'private' && parsed.is_private !== true) continue;
        if (ownerTypeFilter === 'broker' && parsed.is_private !== false) continue;
        properties.push(parsed);
      }
    } catch (error) {
      errors.push(`Card ${i}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log(`[parser-madlan-html] ✅ Parsed ${properties.length} properties`);
  
  return {
    success: true,
    properties,
    stats: {
      total_found: properties.length,
      with_price: properties.filter(p => p.price !== null).length,
      with_rooms: properties.filter(p => p.rooms !== null).length,
      with_address: properties.filter(p => p.address !== null).length,
      with_size: properties.filter(p => p.size !== null).length,
      with_floor: properties.filter(p => p.floor !== null).length,
      private_count: properties.filter(p => p.is_private === true).length,
      broker_count: properties.filter(p => p.is_private === false).length,
      unknown_count: properties.filter(p => p.is_private === null).length,
    },
    errors
  };
}

// ============================================
// Card Splitting
// ============================================

function splitIntoCards(html: string): string[] {
  const cards: string[] = [];
  const marker = 'data-auto="listed-bulletin"';
  let startIdx = html.indexOf(marker);
  
  while (startIdx >= 0) {
    const nextIdx = html.indexOf(marker, startIdx + marker.length);
    const cardHtml = nextIdx >= 0 
      ? html.substring(startIdx, nextIdx) 
      : html.substring(startIdx, Math.min(startIdx + 10000, html.length));
    cards.push(cardHtml);
    startIdx = nextIdx;
  }
  
  return cards;
}

// ============================================
// Extract text content after a data-auto attribute
// ============================================

function extractDataAutoText(cardHtml: string, autoName: string): string | null {
  const marker = `data-auto="${autoName}"`;
  const markerIdx = cardHtml.indexOf(marker);
  if (markerIdx < 0) return null;
  
  // Find the element's content - look for the next > then capture text until <
  const afterMarker = cardHtml.substring(markerIdx);
  
  // Find closing > of the element tag
  const tagClose = afterMarker.indexOf('>');
  if (tagClose < 0) return null;
  
  // Get content after the tag closes
  const afterTag = afterMarker.substring(tagClose + 1);
  
  // Extract text content, stripping nested HTML tags
  // Take up to 500 chars and strip tags
  const contentChunk = afterTag.substring(0, 500);
  const text = contentChunk
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  
  // Take first meaningful line (before excessive whitespace)
  const firstLine = text.split(/\s{3,}/)[0]?.trim();
  return firstLine || null;
}

// ============================================
// Parse a single listing card
// ============================================

function parseHtmlCard(cardHtml: string, propertyType: 'rent' | 'sale'): ParsedProperty | null {
  // Extract bulletin ID
  const idMatch = cardHtml.match(/data-auto-bulletin-id="([^"]+)"/);
  if (!idMatch) return null;
  const sourceId = idMatch[1];
  
  // Extract listing URL  
  const urlMatch = cardHtml.match(/href="\/listings\/([^"]+)"/);
  if (!urlMatch) return null;
  const sourceUrl = `https://www.madlan.co.il/listings/${urlMatch[1]}`;
  
  // Skip project listings
  if (cardHtml.includes('/projects/') || cardHtml.includes('פרויקט') || cardHtml.includes('מקבלן')) {
    return null;
  }
  
  // Extract price from data-auto="property-price"
  const priceText = extractDataAutoText(cardHtml, 'property-price');
  const price = priceText ? extractPrice(priceText) : null;
  
  // Extract rooms from data-auto="property-rooms"
  const roomsText = extractDataAutoText(cardHtml, 'property-rooms');
  const rooms = roomsText ? extractRooms(roomsText) : null;
  
  // Extract floor from data-auto="property-floor"
  const floorText = extractDataAutoText(cardHtml, 'property-floor');
  let floor: number | null = null;
  if (floorText) {
    if (/קרקע/.test(floorText)) {
      floor = 0;
    } else {
      floor = extractFloor(floorText);
    }
  }
  
  // Extract size from data-auto="property-size"
  const sizeText = extractDataAutoText(cardHtml, 'property-size');
  const size = sizeText ? extractSize(sizeText) : null;
  
  // Extract address from data-auto="property-address"
  let address = extractDataAutoText(cardHtml, 'property-address');
  
  // Also try image alt text (often has full address with house number)
  if (!address || !/\d/.test(address)) {
    const altMatch = cardHtml.match(/alt="([^"]+)"/);
    if (altMatch) {
      const altParts = altMatch[1].split(',').map(p => p.trim());
      // First part is usually the street address
      if (altParts.length >= 1 && !altParts[0].includes('תל אביב')) {
        const altAddr = altParts[0];
        if (/\d/.test(altAddr)) {
          address = altAddr;
        } else if (!address) {
          address = altAddr;
        }
      }
    }
  }
  
  // Clean address - remove city suffix, property type prefix, and trailing HTML
  if (address) {
    address = address
      .replace(/<[^>]*$/g, '')  // Remove trailing broken HTML tags (e.g., "<div")
      .replace(/\n+/g, ' ')    // Normalize newlines to spaces
      .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
      .replace(/,?\s*תל[\s-]אביב.*$/i, '')
      .replace(/,?\s*ישראל\s*$/i, '')
      .replace(/^(דירה|דירת\s*גן|פנטהאוז|מיני\s*פנטהאוז|בית\s*פרטי|סטודיו|דופלקס|משרד|חנות)\s*(להשכרה|למכירה)?\s*,?\s*/i, '')
      .replace(/^(להשכרה|למכירה)\s*,?\s*/i, '')
      .trim();
    // If after cleaning the address is just city name or empty, discard
    if (!address || /^תל[\s-]אביב/i.test(address)) {
      address = null;
    }
  }
  
  // Skip if no useful data
  if (!price && !rooms && !address && !size) return null;
  
  // Extract neighborhood
  let neighborhood: string | null = null;
  let neighborhoodValue: string | null = null;
  const city = 'תל אביב יפו';
  
  // Try to find neighborhood from the card text
  const cardText = cardHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ');
  
  for (const { pattern, value, label } of KNOWN_NEIGHBORHOODS) {
    if (pattern.test(cardText)) {
      neighborhood = label;
      neighborhoodValue = value;
      break;
    }
  }
  
  // Also check image alt text and JSON-LD caption for neighborhood
  if (!neighborhood) {
    const altMatch = cardHtml.match(/alt="([^"]+)"/);
    if (altMatch) {
      for (const { pattern, value, label } of KNOWN_NEIGHBORHOODS) {
        if (pattern.test(altMatch[1])) {
          neighborhood = label;
          neighborhoodValue = value;
          break;
        }
      }
    }
  }
  
  // Fallback: try to detect from address
  if (!neighborhood && address) {
    for (const [street, info] of Object.entries(STREET_TO_NEIGHBORHOOD)) {
      if (address.includes(street)) {
        neighborhood = info.label;
        neighborhoodValue = info.value;
        break;
      }
    }
  }
  
  // Broker detection
  // In Madlan HTML: broker listings have "תיווך" text or agent office links
  const hasTivuch = cardText.includes('תיווך');
  const hasExclusivity = cardText.includes('בבלעדיות');
  const hasAgentOffice = cardHtml.includes('agentsOffice') || cardHtml.includes('/agents/');
  const hasAgentImage = /realEstateAgent|realEstateOffice/.test(cardHtml);
  
  const isPrivate = (hasTivuch || hasExclusivity || hasAgentOffice || hasAgentImage) ? false : true;
  
  // Build title
  const roomsLabel = rooms ? `${rooms} חדרים` : '';
  const typeLabel = propertyType === 'rent' ? 'להשכרה' : 'למכירה';
  const location = neighborhood || city;
  const title = roomsLabel 
    ? `דירה ${roomsLabel} ${typeLabel} ב${location}`
    : `דירה ${typeLabel} ב${location}`;
  
  return {
    source: 'madlan',
    source_id: sourceId,
    source_url: sourceUrl,
    title,
    city,
    neighborhood,
    neighborhood_value: neighborhoodValue,
    address,
    price,
    rooms,
    size,
    floor,
    property_type: propertyType,
    is_private: isPrivate,
    entry_date: null,
    features: {},
    raw_text: cardText.substring(0, 500)
  };
}
