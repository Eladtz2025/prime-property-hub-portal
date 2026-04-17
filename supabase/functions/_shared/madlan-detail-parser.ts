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
  branch?: 'direct' | 'graphql';
}

/**
 * Fetch property details from Madlan detail page.
 */
export async function fetchMadlanDetailFeatures(sourceUrl: string): Promise<MadlanDetailResult | null> {
  console.log(`🔍 Madlan Detail: Fetching ${sourceUrl}`);

  // Method 1: Direct fetch with minimal Next.js headers (matches working scout — ~88% success)
  const htmlResult = await fetchWithBypassHeaders(sourceUrl);
  if (htmlResult) {
    console.log(`✅ Madlan Detail branch=direct success`);
    return { ...htmlResult, branch: 'direct' };
  }

  // Method 2: GraphQL API fallback
  const graphqlResult = await fetchViaGraphQL(sourceUrl);
  if (graphqlResult) {
    console.log(`✅ Madlan Detail branch=graphql success`);
    return { ...graphqlResult, branch: 'graphql' };
  }

  console.warn(`❌ Madlan Detail: All methods failed for ${sourceUrl}`);
  return null;
}

/**
 * Fetch using Next.js bypass headers (same as test-direct-fetch that worked).
 */
async function fetchWithBypassHeaders(sourceUrl: string): Promise<MadlanDetailResult | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Use the SAME minimal headers as scout-madlan-jina (proven to work, ~88% success).
      // Heavier browser-like headers (User-Agent/Referer/Origin) trigger Madlan blocking.
      const response = await fetch(sourceUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Nextjs-Data': '1',
          'Accept-Language': 'he-IL,he;q=0.9',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ Madlan Detail attempt ${attempt + 1}: HTTP ${response.status}`);
        if (attempt < 1) await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      const html = await response.text();
      if (!html || html.length < 500) {
        console.warn(`⚠️ Madlan Detail: Short response (${html.length} chars)`);
        continue;
      }

      // Try JSON response first (Next.js data route)
      if (html.startsWith('{') || html.startsWith('[')) {
        try {
          const jsonData = JSON.parse(html);
          const result = parseNextJsJson(jsonData);
          if (result && (Object.keys(result.features).length > 0 || result.size || result.floor)) {
            console.log(`✅ Madlan Detail (JSON): ${Object.keys(result.features).length} features`);
            return result;
          }
        } catch (e) { /* fall through to HTML parsing */ }
      }

      // Check for PerimeterX captcha page
      if (html.length < 50000 && html.includes('_pxAppId') && !html.includes('data-auto=')) {
        console.warn(`⚠️ Madlan Detail: PerimeterX captcha page`);
        if (attempt < 1) await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      const result = parseDetailHtml(html);
      if (result && (Object.keys(result.features).length > 0 || result.size || result.floor)) {
        console.log(`✅ Madlan Detail (HTML): ${Object.keys(result.features).length} features, size=${result.size}, floor=${result.floor}, rooms=${result.rooms}, poc=${result.pocType}`);
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
 * Parse Next.js JSON response (__NEXT_DATA__ or X-Nextjs-Data response).
 */
function parseNextJsJson(data: any): MadlanDetailResult | null {
  const result: MadlanDetailResult = { features: {} };
  
  // Navigate to page props
  const pageProps = data?.pageProps || data?.props?.pageProps;
  if (!pageProps) return null;

  const poi = pageProps?.poi || pageProps?.initialData?.poi;
  if (!poi) return null;

  // Extract basic fields
  if (poi.price) result.price = parseInt(String(poi.price));
  if (poi.area) result.size = parseInt(String(poi.area));
  if (poi.floor != null) result.floor = parseInt(String(poi.floor));
  if (poi.totalFloors) result.totalFloors = parseInt(String(poi.totalFloors));
  if (poi.rooms) result.rooms = parseFloat(String(poi.rooms));

  // Extract features from additionalDetails or amenities
  const amenities = poi.amenities || poi.additionalDetails || {};
  const boolMapping: Record<string, string> = {
    parking: 'parking', balcony: 'balcony', elevator: 'elevator',
    secureRoom: 'mamad', safeRoom: 'mamad', storage: 'storage',
    garden: 'yard', accessible: 'accessible', furnished: 'furnished',
    airConditioner: 'aircon', airCondition: 'aircon',
    pets: 'pets', renovated: 'renovated', garage: 'garage',
    bars: 'bars', sunHeater: 'sun_water_heater', pool: 'pool',
  };

  for (const [apiKey, featureKey] of Object.entries(boolMapping)) {
    if (amenities[apiKey] === true) result.features[featureKey] = true;
    else if (amenities[apiKey] === false) result.features[featureKey] = false;
  }

  // POC type
  if (poi.pocType === 'agent' || poi.contactType === 'agent') result.pocType = 'agent';
  else if (poi.pocType === 'private' || poi.contactType === 'private') result.pocType = 'private';

  return result;
}

/**
 * Fetch property data via Madlan GraphQL API as fallback.
 */
async function fetchViaGraphQL(sourceUrl: string): Promise<MadlanDetailResult | null> {
  // Extract property ID from URL: /listing/{id} or /rent/{id} etc.
  const idMatch = sourceUrl.match(/\/([a-f0-9-]{20,})(?:\?|$|\/)/i) 
    || sourceUrl.match(/\/(\d{5,})(?:\?|$|\/)/);
  if (!idMatch) {
    console.warn(`⚠️ Madlan GraphQL: Cannot extract ID from ${sourceUrl}`);
    return null;
  }

  const propertyId = idMatch[1];
  console.log(`🔍 Madlan GraphQL fallback: ID=${propertyId}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('https://www.madlan.co.il/api2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': sourceUrl,
        'Origin': 'https://www.madlan.co.il',
      },
      body: JSON.stringify({
        operationName: 'poiByIds',
        variables: { ids: [propertyId] },
        query: `query poiByIds($ids: [String!]!) { poiByIds(ids: $ids) { id price area floor totalFloors rooms amenities contactType pocType additionalProperty { name value } } }`,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`⚠️ Madlan GraphQL: HTTP ${response.status}`);
      return null;
    }

    const json = await response.json();
    const poi = json?.data?.poiByIds?.[0];
    if (!poi) {
      console.warn(`⚠️ Madlan GraphQL: No POI in response`);
      return null;
    }

    const result: MadlanDetailResult = { features: {} };
    if (poi.price) result.price = parseInt(String(poi.price));
    if (poi.area) result.size = parseInt(String(poi.area));
    if (poi.floor != null) result.floor = parseInt(String(poi.floor));
    if (poi.totalFloors) result.totalFloors = parseInt(String(poi.totalFloors));
    if (poi.rooms) result.rooms = parseFloat(String(poi.rooms));

    // Map amenities
    if (poi.amenities && typeof poi.amenities === 'object') {
      const boolMapping: Record<string, string> = {
        parking: 'parking', balcony: 'balcony', elevator: 'elevator',
        secureRoom: 'mamad', storage: 'storage', garden: 'yard',
        accessible: 'accessible', furnished: 'furnished',
        airConditioner: 'aircon', pets: 'pets', renovated: 'renovated',
        garage: 'garage', bars: 'bars', sunHeater: 'sun_water_heater',
      };
      for (const [apiKey, featureKey] of Object.entries(boolMapping)) {
        if (poi.amenities[apiKey] === true) result.features[featureKey] = true;
        else if (poi.amenities[apiKey] === false) result.features[featureKey] = false;
      }
    }

    // additionalProperty from GraphQL
    if (Array.isArray(poi.additionalProperty)) {
      for (const prop of poi.additionalProperty) {
        mapPropertyValue(prop?.name, prop?.value, result);
      }
    }

    if (poi.pocType) result.pocType = poi.pocType;
    else if (poi.contactType) result.pocType = poi.contactType;

    console.log(`✅ Madlan GraphQL: ${Object.keys(result.features).length} features, size=${result.size}`);
    return result;
  } catch (error) {
    console.error(`❌ Madlan GraphQL fallback failed:`, error);
    return null;
  }
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
  // Use indexOf instead of regex for large HTML (2-3MB)
  const ldMarker = 'application/ld+json';
  let searchFrom = 0;
  
  while (true) {
    const markerIdx = html.indexOf(ldMarker, searchFrom);
    if (markerIdx < 0) break;
    
    // Find the opening > of this script tag
    const tagOpen = html.indexOf('>', markerIdx);
    if (tagOpen < 0) break;
    
    // Find </script> after it
    const scriptClose = html.indexOf('</script>', tagOpen);
    if (scriptClose < 0) break;
    
    const jsonContent = html.substring(tagOpen + 1, scriptClose).trim();
    searchFrom = scriptClose + 9;
    
    if (jsonContent.length < 10) continue;
    
    try {
      const data = JSON.parse(jsonContent);
      processJsonLd(Array.isArray(data) ? data : [data], result);
      console.log(`📋 JSON-LD: parsed ${jsonContent.length} chars, features so far: ${Object.keys(result.features).length}`);
    } catch (e) {
      console.warn(`⚠️ JSON-LD parse failed for ${jsonContent.length} chars`);
    }
  }

  // Fallback: search for additionalProperty array using indexOf
  if (Object.keys(result.features).length === 0) {
    const apIdx = html.indexOf('"additionalProperty"');
    if (apIdx >= 0) {
      const arrayStart = html.indexOf('[', apIdx);
      if (arrayStart >= 0 && arrayStart - apIdx < 20) {
        // Find matching ]
        let depth = 0;
        let i = arrayStart;
        for (; i < html.length && i < arrayStart + 5000; i++) {
          if (html[i] === '[') depth++;
          if (html[i] === ']') { depth--; if (depth === 0) break; }
        }
        if (depth === 0) {
          try {
            const props = JSON.parse(html.substring(arrayStart, i + 1));
            for (const prop of props) {
              mapPropertyValue(prop?.name, prop?.value, result);
            }
            console.log(`📋 additionalProperty fallback: ${props.length} props, features: ${Object.keys(result.features).length}`);
          } catch (e) { /* ignore */ }
        }
      }
    }
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
