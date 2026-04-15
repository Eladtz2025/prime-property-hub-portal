/**
 * Madlan Detail Parser — Next.js Data Route
 * 
 * Uses the same bypass technique as the scout (X-Nextjs-Data: '1' + Accept: 'application/json')
 * to fetch property detail pages and extract structured data.
 * 
 * Falls back to HTML parsing if JSON is not returned.
 */

export interface MadlanDetailResult {
  features: Record<string, boolean>;
  size?: number;
  floor?: number;
  totalFloors?: number;
  rooms?: number;
  price?: number;
  pocType?: string; // 'private' | 'agent' | etc.
}

/**
 * Fetch property details from Madlan using Next.js data route headers.
 */
export async function fetchMadlanDetailFeatures(sourceUrl: string): Promise<MadlanDetailResult | null> {
  console.log(`🔍 Madlan Detail: Fetching ${sourceUrl}`);

  // Try Next.js data approach first (same as scout)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

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
        const errorText = await response.text();
        console.warn(`⚠️ Madlan Detail attempt ${attempt + 1}: HTTP ${response.status}, body: ${errorText.substring(0, 200)}`);
        if (attempt < 1) await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      const body = await response.text();

      if (!body || body.length < 50) {
        console.warn(`⚠️ Madlan Detail: Empty or short response (${body.length} chars)`);
        continue;
      }

      // Try JSON parse (Next.js data route)
      if (contentType.includes('json') || body.startsWith('{')) {
        try {
          const json = JSON.parse(body);
          const result = extractFromNextjsJson(json);
          if (result && Object.keys(result.features).length > 0) {
            console.log(`✅ Madlan Detail (JSON): ${Object.keys(result.features).length} features`);
            return result;
          }
        } catch (e) {
          console.warn(`⚠️ Madlan Detail: JSON parse failed, trying HTML`);
        }
      }

      // Fallback: parse HTML for data-auto attributes and amenity icons
      const result = extractFromHtml(body);
      if (result && Object.keys(result.features).length > 0) {
        console.log(`✅ Madlan Detail (HTML): ${Object.keys(result.features).length} features`);
        return result;
      }

      console.warn(`⚠️ Madlan Detail: No features extracted from ${body.length} chars`);

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
 * Extract features from Next.js JSON response.
 * The JSON structure varies, so we search for amenities/features data recursively.
 */
function extractFromNextjsJson(json: any): MadlanDetailResult | null {
  const result: MadlanDetailResult = { features: {} };

  // Try to find bulletin/property data in pageProps
  const pageProps = json?.pageProps || json?.props?.pageProps;
  if (!pageProps) {
    // Search recursively for data
    const found = findPropertyData(json);
    if (found) return processPropertyData(found);
    return null;
  }

  // Try common Next.js data structures
  const poiData = pageProps?.poi || pageProps?.listing || pageProps?.bulletin || 
                   pageProps?.data?.poi || pageProps?.data?.listing;
  
  if (poiData) {
    return processPropertyData(poiData);
  }

  // Deep search
  const found = findPropertyData(pageProps);
  if (found) return processPropertyData(found);

  return null;
}

/**
 * Recursively search for property data containing amenities.
 */
function findPropertyData(obj: any, depth = 0): any | null {
  if (!obj || depth > 5) return null;
  if (typeof obj !== 'object') return null;

  // If this object has amenities, it's likely property data
  if (obj.amenities && typeof obj.amenities === 'object') {
    return obj;
  }

  // Search children
  for (const key of Object.keys(obj)) {
    const found = findPropertyData(obj[key], depth + 1);
    if (found) return found;
  }

  return null;
}

/**
 * Process property data object into our MadlanDetailResult.
 */
function processPropertyData(data: any): MadlanDetailResult {
  const result: MadlanDetailResult = { features: {} };

  // Map amenities
  if (data.amenities && typeof data.amenities === 'object') {
    const mapping: Record<string, string> = {
      balcony: 'balcony',
      elevator: 'elevator',
      parking: 'parking',
      garage: 'garage',
      secureRoom: 'mamad',
      storage: 'storage',
      garden: 'yard',
      accessible: 'accessible',
      handicapped: 'accessible',
      furnished: 'furnished',
      airConditioner: 'aircon',
      pets: 'pets',
      renovated: 'renovated',
      bars: 'bars',
      boiler: 'boiler',
      kosherKitchen: 'kosher_kitchen',
      nets: 'nets',
      pandorDoors: 'pandor_doors',
      sunWaterHeater: 'sun_water_heater',
      tadiran: 'tadiran',
      warhouse: 'warehouse',
      roommates: 'roommates',
    };

    for (const [madlanKey, ourKey] of Object.entries(mapping)) {
      if (typeof data.amenities[madlanKey] === 'boolean') {
        if (ourKey === 'accessible' && result.features.accessible === true) continue;
        result.features[ourKey] = data.amenities[madlanKey];
      }
    }
  }

  // Numeric fields
  if (typeof data.area === 'number' && data.area > 0) result.size = data.area;
  if (typeof data.floor === 'number') result.floor = data.floor;
  if (typeof data.floors === 'number') result.totalFloors = data.floors;
  if (typeof data.beds === 'number' && data.beds > 0) result.rooms = data.beds;
  if (typeof data.price === 'number' && data.price > 0) result.price = data.price;

  // POC type
  if (data.poc?.type) result.pocType = data.poc.type;

  return result;
}

/**
 * Extract features from Madlan HTML detail page.
 * Looks for amenity icons with data-auto attributes or specific CSS classes.
 */
function extractFromHtml(html: string): MadlanDetailResult | null {
  const result: MadlanDetailResult = { features: {} };

  // Look for __NEXT_DATA__ script tag
  const nextDataMatch = html.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const jsonResult = extractFromNextjsJson(nextData);
      if (jsonResult && Object.keys(jsonResult.features).length > 0) {
        return jsonResult;
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse __NEXT_DATA__');
    }
  }

  // Parse amenity indicators from HTML
  // Madlan uses SVG icons with specific classes for amenities
  const amenityPatterns: Array<{ pattern: RegExp; key: string; value: boolean }> = [
    { pattern: /data-auto="amenity-balcony"[^>]*class="[^"]*active/i, key: 'balcony', value: true },
    { pattern: /data-auto="amenity-elevator"[^>]*class="[^"]*active/i, key: 'elevator', value: true },
    { pattern: /data-auto="amenity-parking"[^>]*class="[^"]*active/i, key: 'parking', value: true },
    { pattern: /data-auto="amenity-secureRoom"[^>]*class="[^"]*active/i, key: 'mamad', value: true },
    { pattern: /data-auto="amenity-storage"[^>]*class="[^"]*active/i, key: 'storage', value: true },
    { pattern: /data-auto="amenity-accessible"[^>]*class="[^"]*active/i, key: 'accessible', value: true },
    { pattern: /data-auto="amenity-furnished"[^>]*class="[^"]*active/i, key: 'furnished', value: true },
    { pattern: /data-auto="amenity-airConditioner"[^>]*class="[^"]*active/i, key: 'aircon', value: true },
    { pattern: /data-auto="amenity-pets"[^>]*class="[^"]*active/i, key: 'pets', value: true },
    { pattern: /data-auto="amenity-renovated"[^>]*class="[^"]*active/i, key: 'renovated', value: true },
    { pattern: /data-auto="amenity-garden"[^>]*class="[^"]*active/i, key: 'yard', value: true },
  ];

  for (const { pattern, key, value } of amenityPatterns) {
    if (pattern.test(html)) {
      result.features[key] = value;
    }
  }

  // Extract numeric fields from data-auto attributes
  const sizeMatch = html.match(/data-auto="property-size"[^>]*>([^<]*)/);
  if (sizeMatch) {
    const size = parseInt(sizeMatch[1].replace(/[^\d]/g, ''));
    if (size > 0 && size < 2000) result.size = size;
  }

  const floorMatch = html.match(/data-auto="property-floor"[^>]*>([^<]*)/);
  if (floorMatch) {
    const floor = parseInt(floorMatch[1].replace(/[^\d]/g, ''));
    if (!isNaN(floor)) result.floor = floor;
  }

  const roomsMatch = html.match(/data-auto="property-rooms"[^>]*>([^<]*)/);
  if (roomsMatch) {
    const rooms = parseFloat(roomsMatch[1].replace(/[^\d.]/g, ''));
    if (rooms > 0 && rooms < 20) result.rooms = rooms;
  }

  const priceMatch = html.match(/data-auto="property-price"[^>]*>([^<]*)/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1].replace(/[^\d]/g, ''));
    if (price > 0) result.price = price;
  }

  return Object.keys(result.features).length > 0 || result.size || result.floor ? result : null;
}
