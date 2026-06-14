/**
 * Yad2 Detail Parser — public JSON item API.
 *
 * Why this design (changed 2026-06-14):
 *   - Yad2 detail pages used to be fetched as HTML via the Cloudflare Worker
 *     proxy and parsed out of __NEXT_DATA__. Yad2's Radware/ShieldSquare WAF now
 *     blocks that proxy (and Jina) — it returns a CAPTCHA shell, so backfill got
 *     nothing for Yad2 (same outage that killed list scraping).
 *   - Yad2's public JSON item API (gw.yad2.co.il/realestate-item/{token}) returns
 *     the SAME item object that __NEXT_DATA__ embedded — description, images,
 *     additionalDetails, address, inProperty, customer — and is reachable from
 *     the Edge runtime (same host extract-phone uses). No HTML, no WAF challenge.
 *
 * Used by backfill-property-data-jina for Yad2. Madlan/Homeless untouched.
 */

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const GW_HEADERS: Record<string, string> = {
  'User-Agent': IPHONE_UA,
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://www.yad2.co.il',
  'Referer': 'https://www.yad2.co.il/',
};
const GW_TIMEOUT_MS = 20000;

export interface Yad2DetailNextResult {
  // Core
  description?: string;
  images?: string[];
  coverImage?: string;
  shelterDistance?: number;

  // Numeric
  price?: number;
  rooms?: number;
  size?: number;            // squareMeter (gross)
  sizeBuild?: number;       // squareMeterBuild (net)
  floor?: number;
  totalFloors?: number;
  parkingSpots?: number;
  balconiesCount?: number;
  pricePerSqm?: number;     // computed

  // Strings
  propertyCondition?: string;
  entryDate?: string;
  address?: string;         // composed: street + houseNumber, city
  city?: string;
  neighborhood?: string;
  street?: string;
  houseNumber?: number;

  // Geo
  lat?: number;
  lon?: number;

  // Owner
  adType?: string;          // 'private' | 'commercial' (commercial = agency)
  isAgency?: boolean;
  agencyName?: string;

  // Features (from inProperty section)
  features: Record<string, boolean>;

  // Diagnostics
  raw_meta_keys?: string[];
}

/** Map Yad2 inProperty item ids to our internal feature keys. */
const IN_PROPERTY_MAP: Record<string, string> = {
  'elevator': 'elevator',
  'parking': 'parking',
  'balcony': 'balcony',
  'shelter': 'mamad',
  'security_room': 'mamad',
  'mamad': 'mamad',
  'storage': 'storage',
  'warehouse': 'storage',
  'air_conditioner': 'airConditioner',
  'air_conditioning': 'airConditioner',
  'tornado_ac': 'tadiran',
  'bars': 'bars',
  'handicap': 'accessible',
  'handicap_access': 'accessible',
  'pets': 'pets',
  'boiler': 'sunHeater',
  'sun_heater': 'sunHeater',
  'renovated': 'renovated',
  'furniture': 'furnished',
  'furnished': 'furnished',
  'pandor_doors': 'pandorDoors',
  'kosher_kitchen': 'kosherKitchen',
  'garden': 'yard',
  'roof': 'roof',
  'long_term': 'longTerm',
  'roommates': 'roommates',
};

/**
 * The JSON API returns inProperty as an OBJECT with camelCase keys like
 * `includeElevator`, `includeParking`, `includeSecurityRoom`, `isRenovated`.
 * Normalize (strip include/is/has prefix, lowercase, drop non-letters) → feature.
 */
const NORMALIZED_FEATURE_MAP: Record<string, string> = {
  elevator: 'elevator',
  parking: 'parking',
  balcony: 'balcony',
  securityroom: 'mamad',
  shelter: 'mamad',
  mamad: 'mamad',
  storage: 'storage',
  warehouse: 'storage',
  airconditioner: 'airConditioner',
  airconditioning: 'airConditioner',
  tornadoac: 'tadiran',
  bars: 'bars',
  accessibility: 'accessible',
  handicap: 'accessible',
  pets: 'pets',
  boiler: 'sunHeater',
  sunheater: 'sunHeater',
  renovated: 'renovated',
  furniture: 'furnished',
  furnished: 'furnished',
  garden: 'yard',
  roof: 'roof',
  pandordoors: 'pandorDoors',
  kosherkitchen: 'kosherKitchen',
  longterm: 'longTerm',
  roommates: 'roommates',
};

/** Map Hebrew text labels (from inProperty[].text) to our feature keys. */
const TEXT_FEATURE_MAP: Record<string, string> = {
  'מעלית': 'elevator',
  'חניה': 'parking',
  'חנייה': 'parking',
  'מרפסת': 'balcony',
  'ממ"ד': 'mamad',
  'ממד': 'mamad',
  'ממ״ד': 'mamad',
  'מחסן': 'storage',
  'מיזוג': 'airConditioner',
  'מזגן': 'airConditioner',
  'מזגן טורנדו': 'tadiran',
  'סורגים': 'bars',
  'גישה לנכים': 'accessible',
  'נגיש לנכים': 'accessible',
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

function mapInPropertyKey(rawKey: string | undefined, text: string | undefined): string | null {
  if (rawKey) {
    if (IN_PROPERTY_MAP[rawKey]) return IN_PROPERTY_MAP[rawKey];
    const norm = rawKey.replace(/^(include|is|has)/i, '').toLowerCase().replace(/[^a-z]/g, '');
    if (NORMALIZED_FEATURE_MAP[norm]) return NORMALIZED_FEATURE_MAP[norm];
  }
  if (text) {
    const trimmed = text.trim();
    if (TEXT_FEATURE_MAP[trimmed]) return TEXT_FEATURE_MAP[trimmed];
    // partial matches
    for (const [k, v] of Object.entries(TEXT_FEATURE_MAP)) {
      if (trimmed.includes(k)) return v;
    }
  }
  return null;
}

/** Extract the Yad2 listing token from a public detail URL. */
function parseYad2Token(sourceUrl: string): string | null {
  const m = sourceUrl.match(/yad2\.co\.il\/realestate\/item\/(?:[^\/]+\/)?([a-zA-Z0-9]+)/i);
  return m ? m[1] : null;
}

/**
 * Fetch a Yad2 detail item via the public JSON API and map it to
 * Yad2DetailNextResult. Returns null on removal / WAF block / failure.
 */
export async function fetchYad2DetailNextData(sourceUrl: string): Promise<Yad2DetailNextResult | null> {
  if (!sourceUrl || !sourceUrl.includes('yad2.co.il')) {
    console.log(`⚠️ yad2-detail-nextdata: invalid URL: ${sourceUrl}`);
    return null;
  }
  const token = parseYad2Token(sourceUrl);
  if (!token) {
    console.warn(`⚠️ yad2-detail-nextdata: no token in URL: ${sourceUrl}`);
    return null;
  }

  const apiUrl = `https://gw.yad2.co.il/realestate-item/${token}`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GW_TIMEOUT_MS);
    try {
      const t0 = Date.now();
      const resp = await fetch(apiUrl, { headers: GW_HEADERS, signal: controller.signal });
      clearTimeout(timeoutId);

      if (resp.status === 404 || resp.status === 410) {
        console.log(`⚠️ Yad2 detail removed (${resp.status}): ${token}`);
        return null;
      }

      const ct = resp.headers.get('content-type') || '';
      const text = await resp.text();

      if (!resp.ok || !ct.includes('application/json')) {
        const blocked = /__uzdbm|ShieldSquare|captcha|perfdrive|<html/i.test(text);
        console.warn(`⚠️ yad2-detail gw attempt ${attempt}: status=${resp.status} ct=${ct} blocked=${blocked}`);
        if (attempt < 2) { await new Promise((r) => setTimeout(r, 3000)); continue; }
        return null;
      }

      let json: any;
      try { json = JSON.parse(text); }
      catch (e) {
        console.warn(`⚠️ yad2-detail gw: JSON parse failed: ${(e as Error).message}`);
        if (attempt < 2) { await new Promise((r) => setTimeout(r, 3000)); continue; }
        return null;
      }

      const item = json?.data;
      if (!item || typeof item !== 'object') {
        console.warn(`⚠️ yad2-detail gw: no data for token ${token}`);
        return null;
      }
      console.log(`✅ yad2-detail gw: ${Date.now() - t0}ms token=${token}`);
      return mapYad2DetailItem(item);
    } catch (err) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ yad2-detail gw fetch error (attempt ${attempt}): ${msg}`);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return null;
}

/**
 * Legacy HTML entry point — extract the item from __NEXT_DATA__ and map it.
 * Retained for compatibility/debugging; the live path uses the JSON API above.
 */
export function parseYad2DetailNextData(html: string): Yad2DetailNextResult | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) {
    console.warn('⚠️ yad2-detail-nextdata: no __NEXT_DATA__ block');
    return null;
  }
  let data: any;
  try { data = JSON.parse(m[1]); }
  catch (e) {
    console.error('❌ yad2-detail-nextdata: JSON parse error', (e as Error).message);
    return null;
  }
  const queries = data?.props?.pageProps?.dehydratedState?.queries || [];
  const itemQ = queries.find((q: any) => Array.isArray(q.queryKey) && q.queryKey[0] === 'item');
  if (!itemQ) {
    console.warn('⚠️ yad2-detail-nextdata: no item query in dehydratedState');
    return null;
  }
  const item = itemQ.state?.data;
  if (!item) return null;
  return mapYad2DetailItem(item);
}

/**
 * Map a Yad2 item object (from either the JSON API or __NEXT_DATA__) to
 * Yad2DetailNextResult. The two sources share this object shape.
 */
export function mapYad2DetailItem(item: any): Yad2DetailNextResult | null {
  if (!item || typeof item !== 'object') return null;

  const result: Yad2DetailNextResult = {
    features: {},
    raw_meta_keys: Object.keys(item.metaData || {}),
  };

  // ===== Description & images =====
  if (item.metaData?.description && typeof item.metaData.description === 'string') {
    const desc = item.metaData.description.trim();
    if (desc.length > 5) result.description = desc;
  }
  if (Array.isArray(item.metaData?.images)) {
    const imgs = item.metaData.images
      .map((u: any) => typeof u === 'string' ? u : u?.src || u?.url)
      .filter((u: any) => typeof u === 'string' && u.startsWith('http'));
    if (imgs.length > 0) result.images = imgs;
  }
  if (typeof item.metaData?.coverImage === 'string' && item.metaData.coverImage.startsWith('http')) {
    result.coverImage = item.metaData.coverImage;
  }
  if (typeof item.metaData?.shelterDistance === 'number') {
    result.shelterDistance = item.metaData.shelterDistance;
  }

  // ===== Numeric / detail fields =====
  if (typeof item.price === 'number' && item.price > 500) result.price = item.price;

  const ad = item.additionalDetails || {};
  if (typeof ad.roomsCount === 'number' && ad.roomsCount > 0) result.rooms = ad.roomsCount;
  if (typeof ad.squareMeter === 'number' && ad.squareMeter > 10) result.size = ad.squareMeter;
  if (typeof ad.squareMeterBuild === 'number' && ad.squareMeterBuild > 10) result.sizeBuild = ad.squareMeterBuild;
  if (typeof ad.buildingTopFloor === 'number' && ad.buildingTopFloor > 0) result.totalFloors = ad.buildingTopFloor;
  // parkingSpacesCount is the AUTHORITATIVE source for parking (inProperty's flag is unreliable).
  if (typeof ad.parkingSpacesCount === 'number' && ad.parkingSpacesCount > 0) {
    result.parkingSpots = ad.parkingSpacesCount;
  }
  if (typeof ad.balconiesCount === 'number') result.balconiesCount = ad.balconiesCount;
  if (typeof ad.entranceDate === 'string') result.entryDate = ad.entranceDate;
  if (ad.propertyCondition?.text) result.propertyCondition = ad.propertyCondition.text;

  if (result.price && result.size) {
    result.pricePerSqm = Math.round(result.price / result.size);
  }

  // ===== Address =====
  const addr = item.address || {};
  if (addr.house?.floor !== undefined && typeof addr.house.floor === 'number') result.floor = addr.house.floor;
  if (addr.house?.number) result.houseNumber = addr.house.number;
  if (addr.city?.text) result.city = addr.city.text;
  if (addr.neighborhood?.text) result.neighborhood = addr.neighborhood.text;
  if (addr.street?.text) result.street = addr.street.text;
  if (addr.coords?.lat) result.lat = addr.coords.lat;
  if (addr.coords?.lon) result.lon = addr.coords.lon;

  if (result.street) {
    let composed = result.street;
    if (result.houseNumber) composed += ` ${result.houseNumber}`;
    if (result.city) composed += `, ${result.city}`;
    result.address = composed;
  }

  // ===== Owner type =====
  if (typeof item.adType === 'string') {
    result.adType = item.adType;
    result.isAgency = item.adType === 'commercial';
  }
  if (item.customer?.agencyName) result.agencyName = item.customer.agencyName;
  if (typeof item.customer?.isAgency === 'boolean') {
    result.isAgency = item.customer.isAgency;
    if (!result.adType) result.adType = item.customer.isAgency ? 'commercial' : 'private';
  }

  // ===== Features (inProperty) =====
  // inProperty can be: array of {id/key, text, included} OR object map of {includeX:bool}.
  const inProp = item.inProperty;
  if (Array.isArray(inProp)) {
    for (const f of inProp) {
      const key = mapInPropertyKey(f?.key || f?.id, f?.text);
      if (!key) continue;
      const present = f?.included !== false && f?.has !== false && f?.disabled !== true;
      result.features[key] = !!present;
    }
  } else if (inProp && typeof inProp === 'object') {
    for (const [k, v] of Object.entries(inProp)) {
      const key = mapInPropertyKey(k, undefined);
      if (!key) continue;
      result.features[key] = !!v;
    }
  }

  // parking is derived ONLY from parkingSpacesCount (inProperty's flag is unreliable).
  if (typeof ad.parkingSpacesCount === 'number') {
    result.features.parking = ad.parkingSpacesCount > 0;
  } else {
    delete result.features.parking;
  }
  // Derive balcony from balconiesCount when not otherwise set
  if (result.balconiesCount !== undefined && result.features.balcony === undefined) {
    result.features.balcony = result.balconiesCount > 0;
  }

  const featCount = Object.keys(result.features).length;
  console.log(`✅ Yad2 detail mapped: desc=${result.description?.length || 0}ch, imgs=${result.images?.length || 0}, features=${featCount}, price=${result.price}, rooms=${result.rooms}, size=${result.size}, neighborhood=${result.neighborhood}, adType=${result.adType}`);

  return result;
}
