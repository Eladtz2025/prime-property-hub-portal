/**
 * Yad2 Detail Parser — Direct API via CF Proxy
 * Routes through CF Worker to bypass WAF, then parses structured JSON
 * from gw.yad2.co.il/realestate-item/{token}
 */

export interface Yad2DetailResult {
  features: Record<string, boolean>;
  size?: number;
  floor?: number;
  totalFloors?: number;
  rooms?: number;
  price?: number;
  neighborhood?: string;
  address?: string;
  adType?: string; // 'private' | 'agency'
  entranceDate?: string;
  isImmediateEntrance?: boolean;
  description?: string;
  propertyCondition?: string;
}

const CF_WORKER_URL = 'https://yad2-proxy.taylor-kelly88.workers.dev/';

function extractToken(sourceUrl: string): string | null {
  const match = sourceUrl.match(/\/item\/([a-z0-9]+)/i)
    || sourceUrl.match(/\/realestate-item\/([a-z0-9]+)/i);
  return match ? match[1] : null;
}

export async function fetchYad2DetailFeatures(sourceUrl: string): Promise<Yad2DetailResult | null> {
  const token = extractToken(sourceUrl);
  if (!token) {
    console.error(`❌ Yad2 parser: could not extract token from ${sourceUrl}`);
    return null;
  }

  const proxyKey = Deno.env.get('YAD2_PROXY_KEY');
  const apiUrl = `https://gw.yad2.co.il/realestate-item/${token}`;

  let jsonText: string | null = null;

  // Strategy 1: CF Worker proxy (if available)
  if (proxyKey) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const resp = await fetch(CF_WORKER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-proxy-key': proxyKey,
          },
          body: JSON.stringify({ url: apiUrl }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          console.warn(`⚠️ Yad2 CF proxy attempt ${attempt + 1} returned ${resp.status}: ${errText.substring(0, 200)}`);
          if (attempt === 0) { await new Promise(r => setTimeout(r, 2000)); continue; }
          return null;
        }

        const proxyData = await resp.json();
        // The CF proxy returns { status, html } — html is the raw body
        if (proxyData.status === 403 || proxyData.status === 429) {
          console.warn(`⚠️ Yad2 upstream returned ${proxyData.status} via proxy`);
          if (attempt === 0) { await new Promise(r => setTimeout(r, 2000)); continue; }
          return null;
        }

        jsonText = proxyData.html || proxyData.body || null;
        if (jsonText) break;
      } catch (e) {
        console.warn(`⚠️ Yad2 CF proxy attempt ${attempt + 1} error:`, e);
        if (attempt === 0) { await new Promise(r => setTimeout(r, 2000)); continue; }
      }
    }
  }

  // Strategy 2: Direct fetch (fallback, usually blocked from cloud IPs)
  if (!jsonText) {
    try {
      const resp = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Referer': 'https://www.yad2.co.il/',
          'Origin': 'https://www.yad2.co.il',
        },
      });
      if (resp.ok) {
        jsonText = await resp.text();
      } else {
        console.warn(`⚠️ Yad2 direct API returned ${resp.status}`);
        await resp.text(); // consume
        return null;
      }
    } catch (e) {
      console.error(`❌ Yad2 direct fetch failed:`, e);
      return null;
    }
  }

  if (!jsonText) {
    console.error(`❌ Yad2 parser: no data received for token ${token}`);
    return null;
  }

  // Parse JSON
  let data: any;
  try {
    const parsed = JSON.parse(jsonText);
    data = parsed?.data || parsed;
  } catch {
    console.error(`❌ Yad2 parser: invalid JSON for token ${token}, preview: ${jsonText.substring(0, 200)}`);
    return null;
  }

  if (!data || typeof data !== 'object') {
    console.error(`❌ Yad2 parser: empty data for token ${token}`);
    return null;
  }

  // Extract features from inProperty
  const inProp = data.inProperty || {};
  const features: Record<string, boolean> = {};

  const featureMap: Record<string, string> = {
    includeAirconditioner: 'airConditioner',
    includeBalcony: 'balcony',
    includeElevator: 'elevator',
    includeParking: 'parking',
    includeSecurityRoom: 'mamad',
    includeWarehouse: 'storage',
    includeFurniture: 'furnished',
    includeBoiler: 'boiler',
    isHandicapped: 'accessible',
    includeBars: 'bars',
    includeKosherKitchen: 'kosherKitchen',
    includeSunHeater: 'sunHeater',
    includePandorDoors: 'pandorDoors',
    includeTadiran: 'tadiran',
  };

  for (const [apiKey, featureName] of Object.entries(featureMap)) {
    if (typeof inProp[apiKey] === 'boolean') {
      features[featureName] = inProp[apiKey];
    }
  }

  // Detect pets from description
  const desc = data.description || '';
  if (/חיות|בעלי חיים|pets?\b/i.test(desc)) {
    if (/מותר|מקבל|ניתן|allowed|welcome|friendly/i.test(desc)) {
      features.pets = true;
    }
  }

  // Detect renovated from propertyCondition
  const condition = data.propertyCondition?.text || data.propertyCondition?.id;
  if (condition) {
    const condStr = String(condition);
    if (/משופץ|שופץ|renovated/i.test(condStr)) {
      features.renovated = true;
    }
    if (/חדש(?:\s*מקבלן)?|new/i.test(condStr)) {
      features.renovated = true;
    }
  }

  // Detect yard/garden
  if (data.gardenArea && Number(data.gardenArea) > 0) {
    features.yard = true;
  }
  if (data.balconiesCount && Number(data.balconiesCount) > 0) {
    features.balcony = true;
  }

  // Numeric fields
  const result: Yad2DetailResult = { features };

  if (data.squareMeter && Number(data.squareMeter) > 0) {
    result.size = Number(data.squareMeter);
  }
  if (data.floor !== undefined && data.floor !== null) {
    result.floor = Number(data.floor);
  }
  if (data.buildingTopFloor !== undefined) {
    result.totalFloors = Number(data.buildingTopFloor);
  }
  if (data.roomsCount && Number(data.roomsCount) > 0) {
    result.rooms = Number(data.roomsCount);
  }
  if (data.price && Number(data.price) > 0) {
    result.price = Number(data.price);
  }

  // Neighborhood and address
  const neighborhood = data.neighborhood?.text || data.neighborhood?.name;
  if (neighborhood) result.neighborhood = neighborhood;

  const street = data.street?.text || data.street?.name || '';
  const house = data.house?.number || data.house?.text || '';
  if (street) {
    result.address = house ? `${street} ${house}` : street;
  }

  // Broker classification
  if (data.adType) {
    result.adType = data.adType;
  }

  // Entrance date
  if (data.entranceDate) result.entranceDate = data.entranceDate;
  if (typeof data.isImmediateEntrance === 'boolean') result.isImmediateEntrance = data.isImmediateEntrance;

  if (desc) result.description = desc;
  if (condition) result.propertyCondition = String(condition);

  console.log(`✅ Yad2 API parsed: ${Object.keys(features).length} features, size=${result.size}, rooms=${result.rooms}, price=${result.price}, adType=${result.adType}`);
  return result;
}
