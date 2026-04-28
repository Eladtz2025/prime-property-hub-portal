/**
 * Yad2 Detail Parser — __NEXT_DATA__ extraction via CF Worker proxy.
 *
 * Why this exists:
 *   - Yad2 detail pages contain full structured data inside the __NEXT_DATA__
 *     JSON blob (description, images, address, condition, balconies, etc.).
 *   - Jina Reader returns CAPTCHA shells often (Radware WAF).
 *   - The internal CF Worker proxy bypasses the WAF reliably (~100% success
 *     for both listing and detail pages).
 *
 * This parser is used by backfill-property-data-jina specifically for Yad2.
 * Madlan/Homeless are untouched.
 */

const CF_WORKER_URL = 'https://yad2-proxy.taylor-kelly88.workers.dev/';
const CF_TIMEOUT_MS = 25000;

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
  // Common identifiers seen in Yad2 next-data items
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
  if (rawKey && IN_PROPERTY_MAP[rawKey]) return IN_PROPERTY_MAP[rawKey];
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

/**
 * Fetch a Yad2 detail page via CF Worker and extract structured data from __NEXT_DATA__.
 * Returns null on failure / removed listing / WAF block.
 */
export async function fetchYad2DetailNextData(sourceUrl: string): Promise<Yad2DetailNextResult | null> {
  if (!sourceUrl || !sourceUrl.includes('yad2.co.il')) {
    console.log(`⚠️ yad2-detail-nextdata: invalid URL: ${sourceUrl}`);
    return null;
  }

  const proxyKey = Deno.env.get('YAD2_PROXY_KEY');
  if (!proxyKey) {
    console.error('❌ yad2-detail-nextdata: YAD2_PROXY_KEY missing');
    return null;
  }

  let html = '';
  let upstreamStatus = 0;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CF_TIMEOUT_MS);
    try {
      const t0 = Date.now();
      const resp = await fetch(CF_WORKER_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-proxy-key': proxyKey },
        body: JSON.stringify({ url: sourceUrl, target: 'yad2' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        console.warn(`⚠️ yad2-detail-nextdata: CF worker ${resp.status} (attempt ${attempt})`);
        await resp.text();
        if (attempt < 2) { await new Promise(r => setTimeout(r, 3000)); continue; }
        return null;
      }
      const json = await resp.json();
      html = json.html || '';
      upstreamStatus = json.status || 0;
      console.log(`✅ yad2-detail CF: ${Date.now() - t0}ms upstream=${upstreamStatus} html=${html.length}`);

      // Check removal / 404
      if (upstreamStatus === 404 || upstreamStatus === 410 ||
          html.includes('error-section') || html.includes('חיפשנו בכל מקום')) {
        console.log(`⚠️ Yad2 detail removed: ${sourceUrl}`);
        return null;
      }
      // Check WAF block
      if (html.includes('Radware') || /Bot\s*Manager\s*Captcha/i.test(html)) {
        console.warn(`⚠️ yad2-detail-nextdata: WAF block (attempt ${attempt})`);
        if (attempt < 2) { await new Promise(r => setTimeout(r, 5000)); continue; }
        return null;
      }
      if (html.length < 5000) {
        console.warn(`⚠️ yad2-detail-nextdata: too short (${html.length})`);
        if (attempt < 2) { await new Promise(r => setTimeout(r, 3000)); continue; }
        return null;
      }
      break;
    } catch (err) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ yad2-detail-nextdata fetch error (attempt ${attempt}): ${msg}`);
      if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (!html) return null;
  return parseYad2DetailNextData(html);
}

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

  const result: Yad2DetailNextResult = {
    features: {},
    raw_meta_keys: Object.keys(item.metaData || {}),
  };

  // ===== Description & images (the missing pieces) =====
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
  if (typeof ad.parkingSpacesCount === 'number') result.parkingSpots = ad.parkingSpacesCount;
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

  // Compose human address: "street houseNumber, city"
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
  // inProperty can be: array of {id, text, included} OR object map
  const inProp = item.inProperty;
  if (Array.isArray(inProp)) {
    for (const f of inProp) {
      const key = mapInPropertyKey(f?.key || f?.id, f?.text);
      if (!key) continue;
      // included/has === true means present
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

  // Derive parking feature from parkingSpots
  if (result.parkingSpots !== undefined && result.features.parking === undefined) {
    result.features.parking = result.parkingSpots > 0;
  }
  // Derive balcony from balconiesCount
  if (result.balconiesCount !== undefined && result.features.balcony === undefined) {
    result.features.balcony = result.balconiesCount > 0;
  }

  const featCount = Object.keys(result.features).length;
  console.log(`✅ Yad2 next-data parsed: desc=${result.description?.length || 0}ch, imgs=${result.images?.length || 0}, features=${featCount}, price=${result.price}, rooms=${result.rooms}, size=${result.size}, neighborhood=${result.neighborhood}, adType=${result.adType}`);

  return result;
}
