/**
 * Homeless Detail Page Parser
 * 
 * Fetches a Homeless.co.il property detail page directly (no Jina, no proxy)
 * and extracts features + size using Cheerio on the real HTML.
 * 
 * Features are determined by CSS classes:
 *   - div.IconOption.on  → feature is PRESENT (true)
 *   - div.IconOption.off → feature is ABSENT (false)
 * 
 * Parking special rules:
 *   - "חניה משותפת" → true
 *   - "חניה ציבורית" / "חניה ברחוב" / "חניה: אין" → false
 */

import { load as cheerioLoad } from "https://esm.sh/cheerio@1.0.0";

export interface HomelessDetailResult {
  features: {
    balcony?: boolean;
    parking?: boolean;
    elevator?: boolean;
    mamad?: boolean;
    storage?: boolean;
    renovated?: boolean;
    pets?: boolean;
    furnished?: boolean;
    aircon?: boolean;
    accessible?: boolean;
  };
  size?: number;
  floor?: number;
  totalFloors?: number;
}

/** Map Hebrew feature labels to our feature keys */
const FEATURE_LABEL_MAP: Record<string, keyof HomelessDetailResult['features']> = {
  'מרפסת': 'balcony',
  'חניה': 'parking',
  'חנייה': 'parking',
  'מעלית': 'elevator',
  'ממד': 'mamad',
  'ממ"ד': 'mamad',
  'מחסן': 'storage',
  'משופצת': 'renovated',
  'חיות מחמד': 'pets',
  'ריהוט': 'furnished',
  'מזגן': 'aircon',
  'מיזוג': 'aircon',
  'נגישות': 'accessible',
  'נגיש': 'accessible',
};

/** Parking text patterns that mean NO parking */
const PARKING_NEGATIVE_PATTERNS = [
  /חניי?ה\s*:?\s*אין/i,
  /חניי?ה\s*ציבורית/i,
  /חניי?ה\s*ברחוב/i,
  /אין\s*חניי?ה/i,
  /ללא\s*חניי?ה/i,
];

/**
 * Fetch a Homeless detail page and extract features + size.
 * Returns null if the page can't be fetched or parsed.
 */
export async function fetchHomelessDetailFeatures(
  sourceUrl: string,
  timeoutMs = 15000,
  maxRetries = 1
): Promise<HomelessDetailResult | null> {
  if (!sourceUrl || !sourceUrl.includes('homeless.co.il')) {
    console.log(`⚠️ homeless-detail-parser: invalid URL: ${sourceUrl}`);
    return null;
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      console.log(`🏠 Homeless detail fetch attempt ${attempt + 1}/${maxRetries + 1}: ${sourceUrl}`);

      const response = await fetch(sourceUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'he-IL,he;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ Homeless detail fetch failed: ${response.status}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        return null;
      }

      const html = await response.text();

      // Validate we got a real detail page, not homepage/redirect
      if (html.length < 500 || !html.includes('IconOption') && !html.includes('viewad')) {
        console.warn(`⚠️ Homeless detail: got redirect or empty page (${html.length} chars)`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        return null;
      }

      return parseHomelessDetailHtml(html);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`⏱️ Homeless detail fetch timeout (attempt ${attempt + 1})`);
      } else {
        console.error(`❌ Homeless detail fetch error:`, error);
      }
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  return null;
}

/**
 * Parse the HTML of a Homeless detail page to extract features and size.
 * Exported for testing.
 */
export function parseHomelessDetailHtml(html: string): HomelessDetailResult {
  const $ = cheerioLoad(html);
  const result: HomelessDetailResult = { features: {} };

  // === Parse IconOption divs ===
  // Each feature is in a <div class="IconOption on"> or <div class="IconOption off">
  $('div.IconOption, .IconOption').each((_i, el) => {
    const $el = $(el);
    const classes = ($el.attr('class') || '').toLowerCase();
    const text = $el.text().trim();
    const isOn = classes.includes(' on') || classes.split(/\s+/).includes('on');
    const isOff = classes.includes(' off') || classes.split(/\s+/).includes('off');

    if (!isOn && !isOff) return; // Skip if no clear state

    // Find which feature this represents
    for (const [label, key] of Object.entries(FEATURE_LABEL_MAP)) {
      if (text.includes(label)) {
        if (key === 'parking') {
          // Special parking logic
          if (isOff) {
            result.features.parking = false;
          } else {
            // Check if parking text is actually negative
            const isNegativeParking = PARKING_NEGATIVE_PATTERNS.some(p => p.test(text));
            result.features.parking = !isNegativeParking;
          }
        } else {
          result.features[key] = isOn;
        }
        break; // Don't match multiple labels per div
      }
    }
  });

  // === Parse size (מ"ר) ===
  const sizePatterns = [
    /(\d{2,4})\s*מ"ר/,
    /מ"ר\s*:?\s*(\d{2,4})/,
    /שטח\s*:?\s*(\d{2,4})/,
  ];

  const fullText = $.text();
  for (const pattern of sizePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      const size = parseInt(match[1], 10);
      if (size >= 10 && size <= 1000) {
        result.size = size;
        break;
      }
    }
  }

  // === Parse floor ===
  const floorMatch = fullText.match(/קומה\s*:?\s*(\d{1,2})\s*(?:מתוך\s*(\d{1,2}))?/);
  if (floorMatch) {
    result.floor = parseInt(floorMatch[1], 10);
    if (floorMatch[2]) {
      result.totalFloors = parseInt(floorMatch[2], 10);
    }
  }

  const featureCount = Object.keys(result.features).length;
  console.log(`🏠 Homeless detail parsed: ${featureCount} features, size=${result.size || 'N/A'}, floor=${result.floor || 'N/A'}`);
  console.log(`🏠 Features:`, JSON.stringify(result.features));

  return result;
}
