/**
 * Yad2 Detail Parser — HTML Parser (Cheerio)
 * 
 * Fetches a Yad2 detail page via Jina Reader in HTML mode
 * and extracts data from TWO sections:
 * 
 * 1. "מה יש בנכס" (Features grid):
 *    - <li data-testid="xxx-item"> → feature is PRESENT (true)
 *    - <li class="...disabled..." data-testid="xxx-item"> → feature is ABSENT (false)
 * 
 * 2. "פרטים נוספים" (Additional details):
 *    - Structured <dl> with <dd> labels and <dt> values, each with data-testid
 *    - property-condition-value, parking-value, building-top-floor-value, etc.
 * 
 * Also extracts price from header and address from title.
 */

import { load as cheerioLoad } from "https://esm.sh/cheerio@1.0.0";

export interface Yad2DetailResult {
  features: Record<string, boolean>;
  size?: number;
  floor?: number;
  rooms?: number;
  price?: number;
  propertyCondition?: string;
  adType?: string;
  totalFloors?: number;
  pricePerSqm?: number;
  parkingSpots?: number;
  entryDate?: string;
  address?: string;
}

/** Map data-testid values to our feature keys */
const TESTID_FEATURE_MAP: Record<string, string> = {
  'elevator-item': 'elevator',
  'parking-item': 'parking',
  'balcony-item': 'balcony',
  'security-room-item': 'mamad',
  'warehouse-item': 'storage',
  'air-conditioning-item': 'airConditioner',
  'tornado-ac-item': 'tadiran',
  'bars-item': 'bars',
  'handicap-access-item': 'accessible',
  'pets-item': 'pets',
  'boiler-item': 'sunHeater',
  'renovated-item': 'renovated',
  'furnished-item': 'furnished',
  'pandor-doors-item': 'pandorDoors',
  'kosher-kitchen-item': 'kosherKitchen',
  'garden-item': 'yard',
  'roof-item': 'roof',
  'long-term-item': 'longTerm',
  'roommates-item': 'roommates',
};

/**
 * Fetch a Yad2 detail page via Jina in HTML mode and extract features.
 * Returns null if page can't be fetched or parsed.
 */
export async function fetchYad2DetailFeatures(
  sourceUrl: string,
  timeoutMs = 55000,
  maxRetries = 2
): Promise<Yad2DetailResult | null> {
  if (!sourceUrl || !sourceUrl.includes('yad2.co.il')) {
    console.log(`⚠️ yad2-detail-parser: invalid URL: ${sourceUrl}`);
    return null;
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      console.log(`🟠 Yad2 HTML fetch attempt ${attempt + 1}/${maxRetries + 1}: ${sourceUrl}`);

      const response = await fetch(`https://r.jina.ai/${sourceUrl}`, {
        method: 'GET',
        headers: {
          'X-No-Cache': 'true',
          'X-Wait-For-Selector': '[data-testid="whats-in-property-section-section"]',
          'X-Timeout': '45',
          'X-Locale': 'he-IL',
          'Accept': 'text/html',
          'X-Return-Format': 'html',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ Yad2 HTML fetch failed: status ${response.status}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
          continue;
        }
        return null;
      }

      const html = await response.text();
      console.log(`✅ Yad2 HTML fetched: ${html.length} chars`);

      // Check for 404 / removed listing
      if (html.includes('error-section') || html.includes('חיפשנו בכל מקום')) {
        console.log(`⚠️ Yad2: listing removed (404)`);
        return null;
      }

      return parseYad2Html(html);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏱️ Yad2 HTML fetch timeout (attempt ${attempt + 1})`);
      } else {
        console.error(`❌ Yad2 HTML fetch error (attempt ${attempt + 1}):`, error);
      }
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
      }
    }
  }

  console.error(`❌ All Yad2 HTML fetch attempts failed for ${sourceUrl}`);
  return null;
}

/**
 * Parse Yad2 detail page HTML and extract features + structured details.
 * Exported for testing.
 */
export function parseYad2Html(html: string): Yad2DetailResult | null {
  if (!html || html.length < 500) return null;

  const $ = cheerioLoad(html);
  const features: Record<string, boolean> = {};
  const result: Yad2DetailResult = { features };

  // ====================================================
  // SECTION 1: "מה יש בנכס" — Feature grid via data-testid
  // ====================================================
  const featureItems = $('[data-testid="in-property-grid"] li[data-testid]');

  if (featureItems.length === 0) {
    // Fallback: try all li with data-nagish="content-in-property"
    const fallbackItems = $('li[data-nagish="content-in-property"]');
    if (fallbackItems.length > 0) {
      console.log(`⚠️ Yad2: using fallback selector, found ${fallbackItems.length} items`);
      extractFeatureItems($, fallbackItems, features);
    } else {
      console.log(`⚠️ Yad2 HTML: no feature items found`);
    }
  } else {
    extractFeatureItems($, featureItems, features);
  }

  // Sanity check: if all features are true (none false), CSS class parsing is likely broken
  const totalFeatures = Object.keys(features).length;
  const falseCount = Object.values(features).filter(v => v === false).length;
  if (totalFeatures >= 10 && falseCount === 0) {
    console.warn('⚠️ Yad2: All features are true — CSS class parsing likely broken, clearing features');
    for (const key of Object.keys(features)) {
      delete features[key];
    }
  }

  // ====================================================
  // SECTION 2: "פרטים נוספים" — Structured details via data-testid
  // ====================================================
  
  // Property condition (מצב הנכס)
  const conditionEl = $('[data-testid="property-condition-value"]');
  if (conditionEl.length) {
    result.propertyCondition = conditionEl.text().trim();
  }

  // Size (מ"ר בנוי)
  const sizeEl = $('[data-testid="square-meter-build-value"]');
  if (sizeEl.length) {
    const sizeNum = parseInt(sizeEl.text().replace(/[^\d]/g, ''));
    if (sizeNum > 10 && sizeNum < 2000) result.size = sizeNum;
  }

  // Total floors in building (קומות בבניין)
  const totalFloorsEl = $('[data-testid="building-top-floor-value"]');
  if (totalFloorsEl.length) {
    const tf = parseInt(totalFloorsEl.text().replace(/[^\d]/g, ''));
    if (tf > 0 && tf < 200) result.totalFloors = tf;
  }

  // Parking spots (חניות)
  const parkingEl = $('[data-testid="parking-value"]');
  if (parkingEl.length) {
    const spots = parseInt(parkingEl.text().replace(/[^\d]/g, ''));
    if (spots > 0 && spots < 20) {
      result.parkingSpots = spots;
      // Also set parking feature to true if parking spots > 0
      features.parking = true;
    }
  }

  // Price per sqm (מחיר למ"ר)
  const pricePerSqmEl = $('[data-testid="price-per-squaremeter-value"]');
  if (pricePerSqmEl.length) {
    const pps = parseInt(pricePerSqmEl.text().replace(/[^\d]/g, ''));
    if (pps > 100 && pps < 500000) result.pricePerSqm = pps;
  }

  // Entry date (תאריך כניסה)
  const entryDateEl = $('[data-testid="entrance-date-value"]');
  if (entryDateEl.length) {
    result.entryDate = entryDateEl.text().trim();
  }

  // Deal type (סוג העסקה) — used for broker/ad-type detection
  const dealTypeEl = $('[data-testid="deal-type-value"]');
  
  // Floor — from header details or structured
  const floorEl = $('[data-testid="floor-value"]');
  if (floorEl.length) {
    const floorNum = parseInt(floorEl.text().replace(/[^\d]/g, ''));
    if (floorNum >= 0 && floorNum < 200) result.floor = floorNum;
  }

  // Rooms — from header
  const roomsEl = $('[data-testid="rooms-value"]');
  if (roomsEl.length) {
    const roomsNum = parseFloat(roomsEl.text().replace(/[^\d.]/g, ''));
    if (roomsNum > 0 && roomsNum <= 20) result.rooms = roomsNum;
  }

  // ====================================================
  // SECTION 3: Price from header
  // ====================================================
  const priceEl = $('[data-testid="price"]');
  if (priceEl.length) {
    const priceText = priceEl.text().replace(/[^\d]/g, '');
    const price = parseInt(priceText);
    if (price > 500 && price < 100000000) result.price = price;
  }

  // ====================================================
  // SECTION 4: Address from heading
  // ====================================================
  const headingEl = $('[data-testid="heading"]');
  if (headingEl.length) {
    result.address = headingEl.text().trim();
  }

  // ====================================================
  // SECTION 5: Fallback regex for fields not found via selectors
  // ====================================================
  if (!result.size || !result.floor || !result.rooms || !result.price) {
    const fullText = $.text();

    if (!result.size) {
      const sizeMatch = fullText.match(/(\d+)\s*מ[״"]ר/) || fullText.match(/מ[״"]ר\s*(?:בנוי\s*)?(\d+)/);
      if (sizeMatch) {
        const size = parseInt(sizeMatch[1]);
        if (size > 10 && size < 2000) result.size = size;
      }
    }

    if (result.floor === undefined) {
      const floorMatch = fullText.match(/קומה\s*(\d+)/i);
      if (floorMatch) result.floor = parseInt(floorMatch[1]);
    }

    if (!result.rooms) {
      const roomsMatch = fullText.match(/(\d+(?:\.\d)?)\s*חדרי/);
      if (roomsMatch) {
        const rooms = parseFloat(roomsMatch[1]);
        if (rooms > 0 && rooms <= 20) result.rooms = rooms;
      }
    }

    if (!result.price) {
      const priceMatch = fullText.match(/[‏]?([\d,]+)\s*[‏]?₪/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/,/g, ''));
        if (price > 500 && price < 100000000) result.price = price;
      }
    }
  }

  // Parking fallback from text if not set via structured extraction
  if (features.parking === undefined) {
    const fullText = $.text();
    const NEGATIVE_PARKING = [
      /אין\s*חניי?ה/i,
      /ללא\s*חניי?ה/i,
      /בלי\s*חניי?ה/i,
      /חניי?ה\s*:?\s*אין/i,
      /חניי?ה\s*ציבורית/i,
      /חניי?ה\s*ברחוב/i,
    ];
    if (NEGATIVE_PARKING.some(p => p.test(fullText))) {
      features.parking = false;
    } else if (/חניות?\s*\d+/i.test(fullText) || /חניי?ה/i.test(fullText)) {
      features.parking = true;
    }
  }

  // Broker detection
  const fullText = $.text();
  if (/משרד\s*תיווך|סוכנות|מתווכ|RE\/MAX|רימקס|אנגלו|century/i.test(fullText)) {
    result.adType = 'agency';
  }

  const featureCount = Object.keys(features).length;
  const finalTrueCount = Object.values(features).filter(v => v).length;
  const finalFalseCount = Object.values(features).filter(v => !v).length;
  console.log(`✅ Yad2 HTML parsed: ${featureCount} features (${finalTrueCount}✅/${finalFalseCount}❌), size=${result.size}, rooms=${result.rooms}, floor=${result.floor}, price=${result.price}, condition=${result.propertyCondition}, totalFloors=${result.totalFloors}, parking=${result.parkingSpots}, entryDate=${result.entryDate}`);
  return result;
}

/**
 * Extract feature items from a Cheerio selection of <li> elements.
 */
function extractFeatureItems(
  $: ReturnType<typeof cheerioLoad>,
  items: ReturnType<ReturnType<typeof cheerioLoad>>,
  features: Record<string, boolean>
) {
  items.each((_i, el) => {
    const $el = $(el);
    const testId = $el.attr('data-testid') || '';
    const text = $el.find('span[class*="text"]').text().trim();
    const classes = $el.attr('class') || '';
    const isDisabled = classes.includes('disabled');

    // Map testid to feature key
    let featureKey = TESTID_FEATURE_MAP[testId];
    if (!featureKey && text) {
      // Fallback: match Hebrew text to known features
      const TEXT_FEATURE_MAP: Record<string, string> = {
        'מעלית': 'elevator', 'חניה': 'parking', 'חנייה': 'parking',
        'מרפסת': 'balcony', 'ממ"ד': 'mamad', 'ממד': 'mamad',
        'מחסן': 'storage', 'מיזוג': 'airConditioner', 'מזגן טורנדו': 'tadiran',
        'סורגים': 'bars', 'גישה לנכים': 'accessible', 'חיות מחמד': 'pets',
        'דוד שמש': 'sunHeater', 'משופצת': 'renovated', 'משופץ': 'renovated',
        'מרוהטת': 'furnished', 'מרוהט': 'furnished', 'גינה': 'yard',
        'גג': 'roof', 'דלתות פנדור': 'pandorDoors', 'מטבח כשר': 'kosherKitchen',
        'לטווח ארוך': 'longTerm', 'שותפים': 'roommates',
      };
      featureKey = TEXT_FEATURE_MAP[text];
    }

    if (featureKey) {
      features[featureKey] = !isDisabled;
    }
  });

  console.log(`✅ Yad2 features extracted (${Object.keys(features).length}):`,
    Object.entries(features).map(([k, v]) => `${k}=${v}`).join(', '));
}
