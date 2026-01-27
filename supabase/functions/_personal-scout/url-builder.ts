/**
 * URL Builder for Personal Scout
 * 
 * ISOLATED COPY - Does not modify production code
 * Builds URLs with lead-specific filters (city, price, rooms)
 */

// City mappings - exact copy from production
export const yad2CityMap: Record<string, { topArea: string; area: string; city: string }> = {
  'תל אביב': { topArea: '2', area: '1', city: '5000' },
  'תל אביב יפו': { topArea: '2', area: '1', city: '5000' },
  'ירושלים': { topArea: '1', area: '1', city: '3000' },
  'חיפה': { topArea: '3', area: '1', city: '4000' },
  'ראשון לציון': { topArea: '2', area: '2', city: '8300' },
  'פתח תקווה': { topArea: '2', area: '3', city: '7900' },
  'אשדוד': { topArea: '2', area: '12', city: '70' },
  'נתניה': { topArea: '4', area: '1', city: '7400' },
  'באר שבע': { topArea: '5', area: '1', city: '9000' },
  'חולון': { topArea: '2', area: '1', city: '6600' },
  'בת ים': { topArea: '2', area: '1', city: '6200' },
  'רמת גן': { topArea: '2', area: '1', city: '8600' },
  'הרצליה': { topArea: '2', area: '4', city: '6400' },
  'רעננה': { topArea: '4', area: '2', city: '8700' },
  'גבעתיים': { topArea: '2', area: '1', city: '2650' },
  'כפר סבא': { topArea: '4', area: '2', city: '6900' },
  'הוד השרון': { topArea: '4', area: '2', city: '6500' },
  'רמת השרון': { topArea: '2', area: '4', city: '8800' },
};

export const madlanCityMap: Record<string, string> = {
  'תל אביב': 'תל-אביב-יפו-ישראל',
  'תל אביב יפו': 'תל-אביב-יפו-ישראל',
  'ירושלים': 'ירושלים-ישראל',
  'חיפה': 'חיפה-ישראל',
  'ראשון לציון': 'ראשון-לציון-ישראל',
  'פתח תקווה': 'פתח-תקווה-ישראל',
  'אשדוד': 'אשדוד-ישראל',
  'נתניה': 'נתניה-ישראל',
  'באר שבע': 'באר-שבע-ישראל',
  'חולון': 'חולון-ישראל',
  'בת ים': 'בת-ים-ישראל',
  'רמת גן': 'רמת-גן-ישראל',
  'הרצליה': 'הרצליה-ישראל',
  'רעננה': 'רעננה-ישראל',
  'גבעתיים': 'גבעתיים-ישראל',
  'כפר סבא': 'כפר-סבא-ישראל',
  'הוד השרון': 'הוד-השרון-ישראל',
  'רמת השרון': 'רמת-השרון-ישראל',
};

export const homelessCityMap: Record<string, { code: string }> = {
  'תל אביב': { code: '17,1,150' },
  'תל אביב יפו': { code: '17,1,150' },
  'ירושלים': { code: '1,1,3000' },
  'חיפה': { code: '4,1,4000' },
  'ראשון לציון': { code: '17,2,8300' },
  'פתח תקווה': { code: '17,3,7900' },
  'אשדוד': { code: '17,12,70' },
  'נתניה': { code: '11,1,7400' },
  'באר שבע': { code: '6,1,9000' },
  'חולון': { code: '17,1,6600' },
  'בת ים': { code: '17,1,6200' },
  'רמת גן': { code: '17,1,8600' },
  'הרצליה': { code: '17,4,6400' },
  'רעננה': { code: '11,2,8700' },
};

export interface PersonalUrlParams {
  source: string;
  city: string;
  property_type: 'rent' | 'sale';
  min_price?: number | null;
  max_price?: number | null;
  min_rooms?: number | null;
  max_rooms?: number | null;
  page: number;
}

/**
 * Build URL with lead-specific filters
 * All sources (Yad2, Madlan, Homeless) support price + rooms in URL
 */
export function buildPersonalUrl(params: PersonalUrlParams): string {
  const { source, city, property_type, min_price, max_price, min_rooms, max_rooms, page } = params;
  
  if (source === 'yad2') {
    return buildYad2Url(city, property_type, min_price, max_price, min_rooms, max_rooms, page);
} else if (source === 'madlan') {
    return buildMadlanUrl(city, property_type, min_price, max_price, min_rooms, max_rooms, page);
  } else if (source === 'homeless') {
    return buildHomelessUrl(city, property_type, min_price, max_price, min_rooms, max_rooms, page);
  }
  
  throw new Error(`Unknown source: ${source}`);
}

function buildYad2Url(
  city: string,
  propertyType: 'rent' | 'sale',
  minPrice?: number | null,
  maxPrice?: number | null,
  minRooms?: number | null,
  maxRooms?: number | null,
  page: number = 1
): string {
  const baseUrl = `https://www.yad2.co.il/realestate/${propertyType === 'rent' ? 'rent' : 'forsale'}`;
  const params = new URLSearchParams();
  
  // City mapping
  const cityData = yad2CityMap[city];
  if (cityData) {
    params.set('topArea', cityData.topArea);
    params.set('area', cityData.area);
    params.set('city', cityData.city);
  }
  
  params.set('propertyGroup', 'apartments');
  
  // Price filter - adjust units for sale listings
  // DB stores sale prices in thousands (7000 = 7M), Yad2 expects full price (7000000)
  let adjustedMinPrice = minPrice;
  let adjustedMaxPrice = maxPrice;
  
  if (propertyType === 'sale') {
    // If price looks like thousands (< 100,000), multiply by 1000
    if (maxPrice && maxPrice < 100000) {
      adjustedMinPrice = minPrice ? minPrice * 1000 : null;
      adjustedMaxPrice = maxPrice * 1000;
      console.log(`[personal-scout/url-builder] Adjusted sale prices: ${minPrice}-${maxPrice} → ${adjustedMinPrice}-${adjustedMaxPrice}`);
    }
  }
  
  if (adjustedMinPrice || adjustedMaxPrice) {
    const priceRange = `${adjustedMinPrice || ''}-${adjustedMaxPrice || ''}`;
    params.set('price', priceRange);
  }
  
  // Rooms filter - Yad2 supports this!
  if (minRooms || maxRooms) {
    const roomsRange = `${minRooms || ''}-${maxRooms || ''}`;
    params.set('rooms', roomsRange);
  }
  
  // Pagination
  if (page > 1) {
    params.set('page', page.toString());
  }
  
  const url = `${baseUrl}?${params.toString()}`;
  console.log(`[personal-scout/url-builder] Built Yad2 URL: ${url}`);
  return url;
}

function buildMadlanUrl(
  city: string,
  propertyType: 'rent' | 'sale',
  minPrice?: number | null,
  maxPrice?: number | null,
  minRooms?: number | null,
  maxRooms?: number | null,
  page: number = 1
): string {
  const pathType = propertyType === 'rent' ? 'for-rent' : 'for-sale';
  let baseUrl = `https://www.madlan.co.il/${pathType}`;
  
  // City mapping
  const citySlug = madlanCityMap[city] || city.replace(/\s+/g, '-') + '-ישראל';
  baseUrl += `/${citySlug}`;
  
  // Adjust prices for sale listings (DB stores in thousands, Madlan expects full price)
  let adjustedMinPrice = minPrice;
  let adjustedMaxPrice = maxPrice;
  
  if (propertyType === 'sale') {
    if (maxPrice && maxPrice < 100000) {
      adjustedMinPrice = minPrice ? minPrice * 1000 : null;
      adjustedMaxPrice = maxPrice * 1000;
      console.log(`[personal-scout/url-builder] Adjusted Madlan sale prices: ${minPrice}-${maxPrice} → ${adjustedMinPrice}-${adjustedMaxPrice}`);
    }
  }
  
  // Build filters parameter
  // Format: _minPrice-maxPrice_minRooms-maxRooms
  const priceFilter = `${adjustedMinPrice || ''}-${adjustedMaxPrice || ''}`;
  const roomsFilter = `${minRooms || ''}-${maxRooms || ''}`;
  const filters = `_${priceFilter}_${roomsFilter}`;
  
  const params = new URLSearchParams();
  params.set('filters', filters);
  
  if (page > 1) {
    params.set('page', page.toString());
  }
  
  const url = `${baseUrl}?${params.toString()}`;
  console.log(`[personal-scout/url-builder] Built Madlan URL: ${url}`);
  return url;
}

function buildHomelessUrl(
  city: string,
  propertyType: 'rent' | 'sale',
  minPrice?: number | null,
  maxPrice?: number | null,
  minRooms?: number | null,
  maxRooms?: number | null,
  page: number = 1
): string {
  const baseType = propertyType === 'rent' ? 'rent' : 'sale';
  let url = `https://www.homeless.co.il/${baseType}/`;
  
  // Build parameters with $$ separator (Homeless-specific syntax)
  const params: string[] = [];
  
  // City parameter
  params.push(`city=${encodeURIComponent(city)}`);
  
  // Rooms filter (inumber4 = minimum rooms)
  if (minRooms) {
    params.push(`inumber4=${minRooms}`);
  }
  
  // Price filters
  if (minPrice) {
    params.push(`flong3=${minPrice}`);
  }
  if (maxPrice) {
    params.push(`flong3_1=${maxPrice}`);
  }
  
  // Pagination
  if (page > 1) {
    params.push(`page=${page}`);
  }
  
  // Join with $$ separator (Homeless uses $$ instead of &)
  url += params.join('$$');
  
  console.log(`[personal-scout/url-builder] Built Homeless URL: ${url}`);
  return url;
}
