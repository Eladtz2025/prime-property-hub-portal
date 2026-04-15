/**
 * Yad2 Detail Parser — Direct API
 * Fetches structured JSON from gw.yad2.co.il/realestate-item/{token}
 * Returns features (boolean), numeric fields, and broker classification.
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

function extractToken(sourceUrl: string): string | null {
  // Patterns: /item/{token}, /realestate-item/{token}
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

  const apiUrl = `https://gw.yad2.co.il/realestate-item/${token}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Referer': 'https://www.yad2.co.il/',
    'Origin': 'https://www.yad2.co.il',
    'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
  };

  let response: Response;
  try {
    response = await fetch(apiUrl, { headers });
  } catch (e) {
    console.warn(`⚠️ Yad2 API first attempt failed, retrying...`);
    await new Promise(r => setTimeout(r, 2000));
    try {
      response = await fetch(apiUrl, { headers });
    } catch (e2) {
      console.error(`❌ Yad2 API retry failed:`, e2);
      return null;
    }
  }

  if (!response.ok) {
    console.error(`❌ Yad2 API returned ${response.status} for token ${token}`);
    await response.text(); // consume body
    return null;
  }

  let json: any;
  try {
    json = await response.json();
  } catch {
    console.error(`❌ Yad2 API: invalid JSON for token ${token}`);
    return null;
  }

  // The actual data can be at root or under .data
  const data = json?.data || json;
  if (!data || typeof data !== 'object') {
    console.error(`❌ Yad2 API: empty data for token ${token}`);
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
      features.renovated = true; // new from contractor counts as renovated
    }
  }

  // Detect yard/garden/roof
  if (data.gardenArea && Number(data.gardenArea) > 0) {
    features.yard = true;
  }
  // balconiesCount > 0 reinforces balcony
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
    result.adType = data.adType; // 'private' or 'agency'
  }

  // Entrance date
  if (data.entranceDate) {
    result.entranceDate = data.entranceDate;
  }
  if (typeof data.isImmediateEntrance === 'boolean') {
    result.isImmediateEntrance = data.isImmediateEntrance;
  }

  if (desc) result.description = desc;
  if (condition) result.propertyCondition = String(condition);

  console.log(`✅ Yad2 API parsed: ${Object.keys(features).length} features, size=${result.size}, rooms=${result.rooms}, price=${result.price}, adType=${result.adType}`);
  return result;
}
