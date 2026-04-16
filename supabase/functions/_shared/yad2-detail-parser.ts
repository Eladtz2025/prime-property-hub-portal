/**
 * Yad2 Detail Parser — HTML Parser (Cheerio)
 * 
 * Fetches a Yad2 detail page via Jina Reader in HTML mode
 * and extracts features from "מה יש בנכס" section.
 * 
 * Features are determined by CSS classes:
 *   - <li data-testid="xxx-item"> → feature is PRESENT (true)
 *   - <li class="...disabled..." data-testid="xxx-item"> → feature is ABSENT (false)
 * 
 * Also extracts size, floor, parking from "פרטים נוספים" section (text-based).
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

/** Fallback: map Hebrew text labels to feature keys (if data-testid unknown) */
const TEXT_FEATURE_MAP: Record<string, string> = {
  'מעלית': 'elevator',
  'חניה': 'parking',
  'חנייה': 'parking',
  'מרפסת': 'balcony',
  'ממ"ד': 'mamad',
  'ממד': 'mamad',
  'מחסן': 'storage',
  'מיזוג': 'airConditioner',
  'מזגן טורנדו': 'tadiran',
  'סורגים': 'bars',
  'גישה לנכים': 'accessible',
  'חיות מחמד': 'pets',
  'דוד שמש': 'sunHeater',
  'משופצת': 'renovated',
  'משופץ': 'renovated',
  'מרוהטת': 'furnished',
  'מרוהט': 'furnished',
  'גינה': 'yard',
  'גג': 'roof',
  'דלתות פנדור': 'pandorDoors',
  'מטבח כשר': 'kosherKitchen',
  'לטווח ארוך': 'longTerm',
  'שותפים': 'roommates',
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
 * Parse Yad2 detail page HTML and extract features.
 * Exported for testing.
 */
export function parseYad2Html(html: string): Yad2DetailResult | null {
  if (!html || html.length < 500) return null;

  const $ = cheerioLoad(html);
  const features: Record<string, boolean> = {};
  const result: Yad2DetailResult = { features };

  // === Extract features from "מה יש בנכס" section ===
  const featureItems = $('[data-testid="in-property-grid"] li[data-testid]');

  if (featureItems.length === 0) {
    console.log(`⚠️ Yad2 HTML: no feature items found in "מה יש בנכס"`);
  } else {
    featureItems.each((_i, el) => {
      const $el = $(el);
      const testId = $el.attr('data-testid') || '';
      const text = $el.find('[class*="text"]').text().trim();
      const isDisabled = $el.attr('class')?.includes('disabled') || false;

      // Map testid to feature key
      let featureKey = TESTID_FEATURE_MAP[testId];
      if (!featureKey && text) {
        featureKey = TEXT_FEATURE_MAP[text];
      }

      if (featureKey) {
        features[featureKey] = !isDisabled;
      }
    });

    console.log(`✅ Yad2 HTML features (${Object.keys(features).length}):`,
      Object.entries(features).map(([k, v]) => `${k}=${v}`).join(', '));
  }

  // === Extract from "פרטים נוספים" via text content ===
  const detailsSection = $('[data-testid*="additional-details"], [data-testid*="more-details"]');
  const fullText = $.text();

  // Size
  const sizeMatch = fullText.match(/(\d+)\s*מ[״"]ר/) || fullText.match(/מ[״"]ר\s*(?:בנוי\s*)?(\d+)/);
  if (sizeMatch) {
    const size = parseInt(sizeMatch[1]);
    if (size > 10 && size < 2000) result.size = size;
  }

  // Floor
  const floorMatch = fullText.match(/קומה\s*(\d+)/i);
  if (floorMatch) {
    result.floor = parseInt(floorMatch[1]);
  }

  // Rooms
  const roomsMatch = fullText.match(/(\d+(?:\.\d)?)\s*חדרי/);
  if (roomsMatch) {
    const rooms = parseFloat(roomsMatch[1]);
    if (rooms > 0 && rooms <= 20) result.rooms = rooms;
  }

  // Price
  const priceMatch = fullText.match(/[‏]?([\d,]+)\s*[‏]?₪/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    if (price > 500 && price < 100000000) result.price = price;
  }

  // Parking override from "פרטים נוספים" if not already set
  if (features.parking === undefined) {
    if (/חניות?\s*\d+/i.test(fullText) || /חניי?ה/i.test(fullText)) {
      features.parking = true;
    }
  }

  // Broker detection
  if (/משרד\s*תיווך|סוכנות|מתווכ|RE\/MAX|רימקס|אנגלו|century/i.test(fullText)) {
    result.adType = 'agency';
  }

  console.log(`✅ Yad2 HTML parsed: ${Object.keys(features).length} features, size=${result.size}, rooms=${result.rooms}, floor=${result.floor}`);
  return result;
}
