/**
 * Madlan Detail Parser — GraphQL API
 * 
 * Uses Madlan's internal GraphQL API (/api2) with `poiByIds` query
 * to fetch structured property data (amenities, area, floor, beds, price, poc).
 * 
 * No API key needed — same public API the website uses.
 */

const MADLAN_API_URL = 'https://www.madlan.co.il/api2';

const GRAPHQL_QUERY = `
query poiByIds($ids: [PoiIds!]!) {
  poiByIds(ids: $ids) {
    ... on Bulletin {
      amenities {
        accessible
        airConditioner
        balcony
        bars
        boiler
        elevator
        furnished
        garage
        garden
        handicapped
        kosherKitchen
        mampiKitchen
        nets
        pandorDoors
        parking
        pets
        renovated
        roommates
        secureRoom
        storage
        sunWaterHeater
        tadiran
        unit
        warhouse
      }
      area
      beds
      floor
      floors
      price
      poc {
        type
      }
    }
  }
}
`;

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
 * Extract property ID from Madlan source_url.
 * Patterns:
 *   /listings/XXXXX
 *   /listings/XXXXX?...
 */
function extractMadlanId(url: string): string | null {
  const match = url.match(/\/listings\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Map Madlan amenities object to our feature keys.
 */
function mapAmenitiesToFeatures(amenities: Record<string, any>): Record<string, boolean> {
  const features: Record<string, boolean> = {};

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
    if (typeof amenities[madlanKey] === 'boolean') {
      // For accessible: combine accessible + handicapped (either true = true)
      if (ourKey === 'accessible' && features.accessible === true) continue;
      features[ourKey] = amenities[madlanKey];
    }
  }

  return features;
}

/**
 * Fetch property details from Madlan GraphQL API.
 */
export async function fetchMadlanDetailFeatures(sourceUrl: string): Promise<MadlanDetailResult | null> {
  const propertyId = extractMadlanId(sourceUrl);
  if (!propertyId) {
    console.error(`❌ Madlan: Could not extract ID from URL: ${sourceUrl}`);
    return null;
  }

  console.log(`🔍 Madlan GraphQL: Fetching ID ${propertyId}`);

  const response = await fetch(MADLAN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://www.madlan.co.il/',
      'Origin': 'https://www.madlan.co.il',
    },
    body: JSON.stringify({
      operationName: 'poiByIds',
      query: GRAPHQL_QUERY,
      variables: {
        ids: [{ id: propertyId, type: 'bulletin' }],
      },
    }),
  });

  if (!response.ok) {
    console.error(`❌ Madlan GraphQL: HTTP ${response.status} for ID ${propertyId}`);
    await response.text(); // consume body
    return null;
  }

  const json = await response.json();
  const results = json?.data?.poiByIds;

  if (!results || results.length === 0) {
    console.warn(`⚠️ Madlan GraphQL: No results for ID ${propertyId}`);
    return null;
  }

  const bulletin = results[0];
  if (!bulletin) {
    console.warn(`⚠️ Madlan GraphQL: Empty bulletin for ID ${propertyId}`);
    return null;
  }

  const result: MadlanDetailResult = {
    features: {},
  };

  // Map amenities
  if (bulletin.amenities) {
    result.features = mapAmenitiesToFeatures(bulletin.amenities);
  }

  // Numeric fields
  if (typeof bulletin.area === 'number' && bulletin.area > 0) {
    result.size = bulletin.area;
  }
  if (typeof bulletin.floor === 'number') {
    result.floor = bulletin.floor;
  }
  if (typeof bulletin.floors === 'number') {
    result.totalFloors = bulletin.floors;
  }
  if (typeof bulletin.beds === 'number' && bulletin.beds > 0) {
    result.rooms = bulletin.beds;
  }
  if (typeof bulletin.price === 'number' && bulletin.price > 0) {
    result.price = bulletin.price;
  }

  // POC type
  if (bulletin.poc?.type) {
    result.pocType = bulletin.poc.type;
  }

  console.log(`✅ Madlan GraphQL: Got ${Object.keys(result.features).length} features, size=${result.size}, floor=${result.floor}, rooms=${result.rooms}, poc=${result.pocType}`);

  return result;
}
