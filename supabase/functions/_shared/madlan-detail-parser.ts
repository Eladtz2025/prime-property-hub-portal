/**
 * Madlan Detail Parser — HTML + JSON-LD
 * 
 * Fetches individual Madlan listing pages using direct fetch (same technique as scout).
 * Extracts structured data from:
 * 1. JSON-LD Schema.org (additionalProperty with PropertyValue כן/לא)
 * 2. data-auto attributes (amenity highlights, price, rooms, floor, area)
 * 3. data-auto="agent-tag" for broker detection
 */

export interface MadlanDetailResult {
  features: Record<string, boolean>;
  size?: number;
  floor?: number;
  totalFloors?: number;
  rooms?: number;
  price?: number;
  pocType?: string; // 'private' | 'agent'
}

/**
 * Fetch property details from Madlan detail page.
 */
export async function fetchMadlanDetailFeatures(sourceUrl: string): Promise<MadlanDetailResult | null> {
  console.log(`🔍 Madlan Detail: Fetching ${sourceUrl}`);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(sourceUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'he-IL,he;q=0.9',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response.text();
        console.warn(`⚠️ Madlan Detail attempt ${attempt + 1}: HTTP ${response.status}`);
        if (attempt < 1) await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      const html = await response.text();
      if (!html || html.length < 1000) {
        console.warn(`⚠️ Madlan Detail: Short response (${html.length} chars)`);
        continue;
      }

      // Check for PerimeterX captcha page (no real content)
      if (html.length < 50000 && html.includes('_pxAppId') && !html.includes('data-auto=')) {
        console.warn(`⚠️ Madlan Detail: PerimeterX captcha page`);
        if (attempt < 1) await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      const result = parseDetailHtml(html);
      if (result && (Object.keys(result.features).length > 0 || result.size || result.floor)) {
        console.log(`✅ Madlan Detail: ${Object.keys(result.features).length} features, size=${result.size}, floor=${result.floor}, rooms=${result.rooms}, poc=${result.pocType}`);
        return result;
      }

      console.warn(`⚠️ Madlan Detail: No features from ${html.length} chars`);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏱️ Madlan Detail attempt ${attempt + 1}: timeout`);
      } else {
        console.error(`❌ Madlan Detail attempt ${attempt + 1}:`, error);
      }
      if (attempt < 1) await new Promise(r => setTimeout(r, 3000));
    }
  }

  return null;
}

/**
 * Parse Madlan detail page HTML.
 */
function parseDetailHtml(html: string): MadlanDetailResult | null {
  const result: MadlanDetailResult = { features: {} };

  // === Method 1: JSON-LD Schema.org ===
  extractFromJsonLd(html, result);

  // === Method 2: data-auto attributes ===
  extractFromDataAuto(html, result);

  // === Method 3: data-auto-highlight-amenity ===
  extractFromHighlightAmenities(html, result);

  // === Broker detection ===
  detectBroker(html, result);

  return result;
}

/**
 * Extract from JSON-LD additionalProperty (PropertyValue with כן/לא).
 */
function extractFromJsonLd(html: string, result: MadlanDetailResult): void {
  // Find JSON-LD script(s) - may be in <head>
  const jsonLdRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      processJsonLd(Array.isArray(data) ? data : [data], result);
    } catch (e) {
      // Try to find array of JSON-LD objects
      continue;
    }
  }

  // Also check for inline JSON in the HTML containing additionalProperty
  const inlineMatch = html.match(/"additionalProperty"\s*:\s*\[([\s\S]*?)\]/);
  if (inlineMatch && Object.keys(result.features).length === 0) {
    try {
      const props = JSON.parse(`[${inlineMatch[1]}]`);
      for (const prop of props) {
        mapPropertyValue(prop?.name, prop?.value, result);
      }
    } catch (e) { /* ignore */ }
  }
}

function processJsonLd(items: any[], result: MadlanDetailResult): void {
  for (const item of items) {
    // Extract price from offers
    if (item?.offers?.price) {
      const price = parseInt(String(item.offers.price));
      if (price > 0) result.price = price;
    }

    // Extract size from "size" field (e.g. "97 מ׳׳ר")
    if (item?.size) {
      const sizeNum = parseInt(String(item.size).replace(/[^\d]/g, ''));
      if (sizeNum > 0 && sizeNum < 2000) result.size = sizeNum;
    }

    // Extract additionalProperty (amenities)
    if (Array.isArray(item?.additionalProperty)) {
      for (const prop of item.additionalProperty) {
        mapPropertyValue(prop?.name, prop?.value, result);
      }
    }

    // Recurse into @graph or arrays
    if (Array.isArray(item?.['@graph'])) {
      processJsonLd(item['@graph'], result);
    }
  }
}

/**
 * Map Hebrew property names to feature keys.
 */
function mapPropertyValue(name: string | undefined, value: string | undefined, result: MadlanDetailResult): void {
  if (!name || !value) return;
  const isYes = value === 'כן';
  const isNo = value === 'לא';
  if (!isYes && !isNo) return;

  const mapping: Record<string, string> = {
    'מרפסת': 'balcony',
    'מעלית': 'elevator',
    'חניה': 'parking',
    'חניון': 'parking',
    'גראז\'': 'garage',
    'גראז': 'garage',
    'ממ״ד': 'mamad',
    'ממ"ד': 'mamad',
    'חדר ביטחון': 'mamad',
    'מחסן': 'storage',
    'גינה': 'yard',
    'גן': 'yard',
    'נגיש לנכים': 'accessible',
    'נגישות': 'accessible',
    'מרוהטת': 'furnished',
    'מרוהט': 'furnished',
    'ריהוט': 'furnished',
    'מיזוג אוויר': 'aircon',
    'מיזוג': 'aircon',
    'חיות מחמד': 'pets',
    'חיות': 'pets',
    'משופצת': 'renovated',
    'משופץ': 'renovated',
    'שיפוץ': 'renovated',
    'סורגים': 'bars',
    'דוד שמש': 'sun_water_heater',
    'בריכה': 'pool',
    'ממ״ק': 'shelter',
    'ממ"ק': 'shelter',
    'מקלט': 'shelter',
    'גישה לנכים': 'accessible',
  };

  for (const [hebrewName, featureKey] of Object.entries(mapping)) {
    if (name.includes(hebrewName)) {
      result.features[featureKey] = isYes;
      return;
    }
  }
}

/**
 * Extract numeric data from data-auto attributes.
 */
function extractFromDataAuto(html: string, result: MadlanDetailResult): void {
  // Price: data-auto="current-price"
  const priceContext = extractAfterDataAuto(html, 'current-price', 200);
  if (priceContext && !result.price) {
    const priceNum = parseInt(priceContext.replace(/[^\d]/g, ''));
    if (priceNum > 0) result.price = priceNum;
  }

  // Rooms: data-auto="beds-count"
  const bedsContext = extractAfterDataAuto(html, 'beds-count', 100);
  if (bedsContext && !result.rooms) {
    const roomsMatch = bedsContext.match(/([\d.]+)/);
    if (roomsMatch) {
      const rooms = parseFloat(roomsMatch[1]);
      if (rooms > 0 && rooms < 20) result.rooms = rooms;
    }
  }

  // Floor: data-auto="floor"
  const floorContext = extractAfterDataAuto(html, 'floor', 100);
  if (floorContext && result.floor === undefined) {
    const floorMatch = floorContext.match(/(\d+)/);
    if (floorMatch) result.floor = parseInt(floorMatch[1]);
  }

  // Area/Size: data-auto="area"
  const areaContext = extractAfterDataAuto(html, 'area', 100);
  if (areaContext && !result.size) {
    const sizeMatch = areaContext.match(/(\d+)/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      if (size > 0 && size < 2000) result.size = size;
    }
  }
}

/**
 * Extract text content after a data-auto attribute.
 */
function extractAfterDataAuto(html: string, autoName: string, maxLen: number): string | null {
  const marker = `data-auto="${autoName}"`;
  const idx = html.indexOf(marker);
  if (idx < 0) return null;

  const after = html.substring(idx + marker.length, idx + marker.length + maxLen + 200);
  // Find closing > of the tag, then extract text
  const tagClose = after.indexOf('>');
  if (tagClose < 0) return null;

  const content = after.substring(tagClose + 1, tagClose + 1 + maxLen);
  return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract from data-auto-highlight-amenity attributes (highlighted amenities).
 */
function extractFromHighlightAmenities(html: string, result: MadlanDetailResult): void {
  const highlightRegex = /data-auto-highlight-amenity="([^"]+)"/g;
  let match;
  const highlightMapping: Record<string, string> = {
    parking: 'parking',
    balcony: 'balcony',
    elevator: 'elevator',
    secureRoom: 'mamad',
    storage: 'storage',
    garden: 'yard',
    accessible: 'accessible',
    furnished: 'furnished',
    airConditioner: 'aircon',
    pets: 'pets',
    renovated: 'renovated',
    garage: 'garage',
  };

  while ((match = highlightRegex.exec(html)) !== null) {
    const amenityName = match[1];
    const featureKey = highlightMapping[amenityName];
    if (featureKey && result.features[featureKey] === undefined) {
      // Highlighted amenities are the ones that ARE present
      result.features[featureKey] = true;
    }
  }
}

/**
 * Detect broker from agent-tag or description.
 */
function detectBroker(html: string, result: MadlanDetailResult): void {
  // data-auto="agent-tag" means it's listed by an agent
  if (html.includes('data-auto="agent-tag"')) {
    result.pocType = 'agent';
  } else {
    // Check for "פרטי" (private) indicators
    const privatePatterns = [/data-auto="private-tag"/, /מפרסם פרטי/, /בעל הנכס/];
    for (const p of privatePatterns) {
      if (p.test(html)) {
        result.pocType = 'private';
        break;
      }
    }
  }
}
