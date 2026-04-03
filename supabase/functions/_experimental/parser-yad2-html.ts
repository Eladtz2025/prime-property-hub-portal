/**
 * Yad2 HTML Parser - Extracts properties from __NEXT_DATA__ JSON
 * 
 * When scraping Yad2 via Vercel proxy, we get raw HTML instead of Markdown.
 * Yad2 is a Next.js app, so all listing data is embedded in a
 * <script id="__NEXT_DATA__"> tag as structured JSON.
 * 
 * This is MORE reliable than Markdown parsing since we get structured data directly.
 */

import {
  extractCity,
  extractNeighborhood,
  type ParsedProperty,
  type ParserResult,
} from './parser-utils.ts';

// ============================================
// Main Entry Point
// ============================================

export function parseYad2Html(
  html: string,
  propertyType: 'rent' | 'sale',
  ownerTypeFilter?: 'private' | 'broker' | null
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];

  console.log(`[parser-yad2-html] Input: ${html.length} chars`);

  // Strategy 1: Extract from __NEXT_DATA__
  const nextDataProps = extractFromNextData(html, propertyType, errors);
  if (nextDataProps.length > 0) {
    console.log(`[parser-yad2-html] __NEXT_DATA__ extracted ${nextDataProps.length} properties`);
    for (const prop of nextDataProps) {
      if (ownerTypeFilter === 'private' && prop.is_private !== true) continue;
      if (ownerTypeFilter === 'broker' && prop.is_private !== false) continue;
      properties.push(prop);
    }
  } else {
    // Strategy 2: Fallback - extract from HTML structure
    console.log(`[parser-yad2-html] __NEXT_DATA__ not found or empty, trying HTML fallback`);
    const htmlProps = extractFromHtmlFallback(html, propertyType, errors);
    for (const prop of htmlProps) {
      if (ownerTypeFilter === 'private' && prop.is_private !== true) continue;
      if (ownerTypeFilter === 'broker' && prop.is_private !== false) continue;
      properties.push(prop);
    }
  }

  const stats = calculateStats(properties);
  console.log(`[parser-yad2-html] ✅ Parsed ${properties.length} properties (${stats.private_count} private, ${stats.broker_count} broker, ${stats.unknown_count} unknown)`);

  return { success: true, properties, stats, errors };
}

// ============================================
// __NEXT_DATA__ Extraction
// ============================================

function extractFromNextData(
  html: string,
  propertyType: 'rent' | 'sale',
  errors: string[]
): ParsedProperty[] {
  const properties: ParsedProperty[] = [];

  // Find __NEXT_DATA__ script tag
  const scriptMatch = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    errors.push('__NEXT_DATA__ script tag not found');
    return [];
  }

  let nextData: any;
  try {
    nextData = JSON.parse(scriptMatch[1]);
  } catch (e) {
    errors.push(`Failed to parse __NEXT_DATA__ JSON: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }

  // Navigate the Next.js data structure to find feed items
  // Yad2 typically stores feed data in props.pageProps.feed or similar paths
  const feedItems = findFeedItems(nextData);
  if (!feedItems || feedItems.length === 0) {
    errors.push('No feed items found in __NEXT_DATA__');
    // Log available keys for debugging
    try {
      const pageProps = nextData?.props?.pageProps;
      if (pageProps) {
        console.log(`[parser-yad2-html] pageProps keys: ${Object.keys(pageProps).join(', ')}`);
      }
    } catch (_) { /* ignore */ }
    return [];
  }

  console.log(`[parser-yad2-html] Found ${feedItems.length} feed items in __NEXT_DATA__`);

  for (let i = 0; i < feedItems.length; i++) {
    try {
      const item = feedItems[i];
      const parsed = parseFeedItem(item, propertyType, i);
      if (parsed) {
        properties.push(parsed);
      }
    } catch (error) {
      errors.push(`Feed item ${i}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return properties;
}

/**
 * Recursively search for feed/listing arrays in the __NEXT_DATA__ structure.
 * Yad2 may nest these under various paths depending on the page version.
 */
function findFeedItems(data: any): any[] | null {
  if (!data || typeof data !== 'object') return null;

  // Direct known paths in Yad2 Next.js structure
  const knownPaths = [
    // Common paths for Yad2 feed pages
    data?.props?.pageProps?.feed?.private?.feed_items,
    data?.props?.pageProps?.feed?.feed_items,
    data?.props?.pageProps?.feedItems,
    data?.props?.pageProps?.feed?.agency?.feed_items,
    data?.props?.pageProps?.searchResult?.items,
    data?.props?.pageProps?.searchResult?.private?.items,
    // Dehydrated state (React Query)
    ...(extractFromDehydratedState(data) || []),
  ];

  for (const path of knownPaths) {
    if (Array.isArray(path) && path.length > 0) {
      return path;
    }
  }

  // Fallback: search for arrays with yad2-like item structures
  return deepSearchForFeedItems(data?.props?.pageProps, 0);
}

/**
 * Extract feed items from dehydrated React Query state
 */
function extractFromDehydratedState(data: any): any[][] {
  const results: any[][] = [];
  try {
    const dehydrated = data?.props?.pageProps?.dehydratedState?.queries;
    if (Array.isArray(dehydrated)) {
      for (const query of dehydrated) {
        const queryData = query?.state?.data;
        if (!queryData) continue;
        
        // Check for feed items in query data
        const candidates = [
          queryData?.feed_items,
          queryData?.private?.feed_items,
          queryData?.agency?.feed_items,
          queryData?.items,
          queryData?.data?.feed_items,
          queryData?.data?.items,
          queryData?.pages,
        ];
        
        for (const candidate of candidates) {
          if (Array.isArray(candidate) && candidate.length > 0) {
            // Check if items look like property listings
            const first = candidate[0];
            if (first && (first.id || first.token || first.price || first.address)) {
              results.push(candidate);
            }
            // Handle paginated data (array of pages)
            if (first && Array.isArray(first)) {
              const flatItems = candidate.flat();
              if (flatItems.length > 0 && (flatItems[0].id || flatItems[0].token)) {
                results.push(flatItems);
              }
            }
          }
        }

        // Also check if queryData itself is an array of listings
        if (Array.isArray(queryData) && queryData.length > 0) {
          const first = queryData[0];
          if (first && (first.id || first.token || first.price || first.address)) {
            results.push(queryData);
          }
        }
      }
    }
  } catch (_) { /* ignore */ }
  return results;
}

/**
 * Deep search for arrays that look like property listing data
 */
function deepSearchForFeedItems(obj: any, depth: number): any[] | null {
  if (depth > 5 || !obj || typeof obj !== 'object') return null;

  if (Array.isArray(obj)) {
    // Check if this array contains property-like objects
    if (obj.length > 0 && isPropertyItem(obj[0])) {
      return obj;
    }
    return null;
  }

  for (const key of Object.keys(obj)) {
    // Skip very large or irrelevant keys
    if (key === '__N_SSP' || key === '__N_SSG' || key === 'buildId') continue;
    
    const result = deepSearchForFeedItems(obj[key], depth + 1);
    if (result) return result;
  }

  return null;
}

/**
 * Check if an object looks like a Yad2 property listing
 */
function isPropertyItem(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  // Must have at least a token/id AND some property data
  const hasId = item.id || item.token || item.link_token || item.item_id;
  const hasPropertyData = item.price || item.rooms || item.address || 
    item.street || item.city || item.row_1 || item.row_2 || item.row_3;
  return !!(hasId && hasPropertyData);
}

// ============================================
// Feed Item Parsing
// ============================================

function parseFeedItem(item: any, propertyType: 'rent' | 'sale', index: number): ParsedProperty | null {
  // Extract source ID (token is the unique listing identifier in Yad2)
  const token = item.token || item.link_token || item.id || item.item_id;
  if (!token) return null;

  const sourceId = String(token);
  const sourceUrl = `https://www.yad2.co.il/realestate/item/${sourceId}`;

  // Extract price
  let price: number | null = null;
  if (item.price != null) {
    if (typeof item.price === 'number') {
      price = item.price;
    } else if (typeof item.price === 'string') {
      const cleaned = item.price.replace(/[^\d]/g, '');
      price = cleaned ? parseInt(cleaned, 10) : null;
    } else if (typeof item.price === 'object') {
      // price might be { value: 8500 } or { price: 8500 }
      price = item.price.value || item.price.price || null;
    }
  }
  // Fallback: look in other price fields
  if (!price && item.monthly_price) {
    price = typeof item.monthly_price === 'number' ? item.monthly_price : parseInt(String(item.monthly_price).replace(/[^\d]/g, ''), 10);
  }

  // Extract rooms
  let rooms: number | null = null;
  if (item.rooms != null) {
    rooms = typeof item.rooms === 'number' ? item.rooms : parseFloat(String(item.rooms));
  }
  // Fallback: check row data for rooms
  if (!rooms && item.row_2) {
    const roomsMatch = String(item.row_2).match(/(\d+(?:\.\d)?)\s*חדרים/);
    if (roomsMatch) rooms = parseFloat(roomsMatch[1]);
  }

  // Extract floor
  let floor: number | null = null;
  if (item.floor != null) {
    floor = item.floor === 'קרקע' ? 0 : (typeof item.floor === 'number' ? item.floor : parseInt(String(item.floor), 10));
  }
  if (floor === null && item.row_2) {
    const floorMatch = String(item.row_2).match(/קומה\s*(\d+|קרקע)/);
    if (floorMatch) floor = floorMatch[1] === 'קרקע' ? 0 : parseInt(floorMatch[1], 10);
  }

  // Extract size (square meters)
  let size: number | null = null;
  if (item.square_meters != null || item.squareMeter != null || item.size != null) {
    const rawSize = item.square_meters || item.squareMeter || item.size;
    size = typeof rawSize === 'number' ? rawSize : parseInt(String(rawSize), 10);
  }
  if (!size && item.row_2) {
    const sizeMatch = String(item.row_2).match(/(\d+)\s*מ[״"']?ר/);
    if (sizeMatch) size = parseInt(sizeMatch[1], 10);
  }

  // Extract address
  let address: string | null = null;
  if (item.address) {
    address = typeof item.address === 'string' ? item.address : 
      (item.address.street ? `${item.address.street} ${item.address.house_number || ''}`.trim() : null);
  } else if (item.street) {
    address = item.house_number ? `${item.street} ${item.house_number}` : item.street;
  } else if (item.row_1) {
    // row_1 typically contains address info
    address = String(item.row_1).split(',')[0]?.trim() || null;
  }

  // Extract city
  let city: string | null = null;
  if (item.city) {
    city = typeof item.city === 'string' ? item.city : (item.city.name || item.city.text || null);
  } else if (item.area_name) {
    city = item.area_name;
  }
  // Fallback: extract from row_1 or address
  if (!city && item.row_1) {
    city = extractCity(String(item.row_1));
  }

  // Extract neighborhood
  let neighborhood: string | null = null;
  let neighborhoodValue: string | null = null;
  if (item.neighborhood) {
    neighborhood = typeof item.neighborhood === 'string' ? item.neighborhood : 
      (item.neighborhood.name || item.neighborhood.text || null);
  } else if (item.area) {
    neighborhood = typeof item.area === 'string' ? item.area : null;
  }
  if (!neighborhood && item.row_1) {
    const neighborhoodInfo = extractNeighborhood(String(item.row_1), city || '');
    if (neighborhoodInfo) {
      neighborhood = neighborhoodInfo.label;
      neighborhoodValue = neighborhoodInfo.value;
    }
  }

  // Detect private vs broker
  let isPrivate: boolean | null = null;
  if (item.merchant === false || item.is_private === true || item.type === 'private' || item.contact_type === 'private') {
    isPrivate = true;
  } else if (item.merchant === true || item.is_private === false || item.type === 'agency' || item.contact_type === 'agency' || item.agency_name || item.office_name) {
    isPrivate = false;
  }
  // Check for agency in row data
  if (isPrivate === null && item.row_3) {
    const row3 = String(item.row_3);
    if (row3.includes('פרטי') || row3.includes('בעלים')) {
      isPrivate = true;
    }
  }

  // Skip items without meaningful data
  if (!price && !rooms && !address) return null;

  // Build title
  const typeLabel = propertyType === 'rent' ? 'להשכרה' : 'למכירה';
  const roomsLabel = rooms ? `${rooms} חדרים` : '';
  const location = neighborhood || city;
  let title: string;
  if (roomsLabel && location) {
    title = `דירה ${roomsLabel} ${typeLabel} ב${location}`;
  } else if (location) {
    title = `דירה ${typeLabel} ב${location}`;
  } else if (roomsLabel) {
    title = `דירה ${roomsLabel} ${typeLabel}`;
  } else {
    title = `דירה ${typeLabel}`;
  }

  return {
    source: 'yad2',
    source_id: `yad2_${sourceId}`,
    source_url: sourceUrl,
    title,
    city: city || 'תל אביב יפו',
    neighborhood,
    neighborhood_value: neighborhoodValue,
    address,
    price,
    rooms,
    size,
    floor,
    property_type: propertyType,
    is_private: isPrivate,
    entry_date: item.date || item.updated_at || item.created_at || null,
    raw_text: JSON.stringify(item).substring(0, 500),
    raw_data: {
      original_keys: Object.keys(item),
      agency_name: item.agency_name || item.office_name || null,
    },
  };
}

// ============================================
// HTML Fallback Extraction
// ============================================

function extractFromHtmlFallback(
  html: string,
  propertyType: 'rent' | 'sale',
  errors: string[]
): ParsedProperty[] {
  const properties: ParsedProperty[] = [];

  // Look for feed item links in HTML: /realestate/item/XXXXX
  const itemRegex = /href="\/realestate\/item\/([a-z0-9]+)"/gi;
  const seenIds = new Set<string>();
  let match;

  while ((match = itemRegex.exec(html)) !== null) {
    const token = match[1];
    if (seenIds.has(token)) continue;
    seenIds.add(token);

    // Try to extract data from surrounding HTML context
    const contextStart = Math.max(0, match.index - 2000);
    const contextEnd = Math.min(html.length, match.index + 2000);
    const context = html.substring(contextStart, contextEnd);

    // Extract price from context
    let price: number | null = null;
    const priceMatch = context.match(/₪\s*([\d,]+)|([\d,]+)\s*₪/);
    if (priceMatch) {
      const priceStr = (priceMatch[1] || priceMatch[2]).replace(/,/g, '');
      price = parseInt(priceStr, 10);
      if (price < 500 || price > 100000000) price = null;
    }

    // Extract rooms
    let rooms: number | null = null;
    const roomsMatch = context.match(/(\d+(?:\.\d)?)\s*חדרים/);
    if (roomsMatch) rooms = parseFloat(roomsMatch[1]);

    // Extract floor
    let floor: number | null = null;
    const floorMatch = context.match(/קומה\s*(\d+|קרקע)/);
    if (floorMatch) floor = floorMatch[1] === 'קרקע' ? 0 : parseInt(floorMatch[1], 10);

    // Extract size
    let size: number | null = null;
    const sizeMatch = context.match(/(\d+)\s*מ[״"']?ר/);
    if (sizeMatch) size = parseInt(sizeMatch[1], 10);

    if (!price && !rooms) continue;

    const typeLabel = propertyType === 'rent' ? 'להשכרה' : 'למכירה';

    properties.push({
      source: 'yad2',
      source_id: `yad2_${token}`,
      source_url: `https://www.yad2.co.il/realestate/item/${token}`,
      title: `דירה ${typeLabel}`,
      city: 'תל אביב יפו',
      neighborhood: null,
      neighborhood_value: null,
      address: null,
      price,
      rooms,
      size,
      floor,
      property_type: propertyType,
      is_private: null,
      entry_date: null,
      raw_text: context.substring(0, 300),
    });
  }

  return properties;
}

// ============================================
// Helper Functions
// ============================================

function calculateStats(properties: ParsedProperty[]): ParserResult['stats'] {
  return {
    total_found: properties.length,
    with_price: properties.filter(p => p.price !== null).length,
    with_rooms: properties.filter(p => p.rooms !== null).length,
    with_address: properties.filter(p => p.address !== null).length,
    with_size: properties.filter(p => p.size !== null).length,
    with_floor: properties.filter(p => p.floor !== null).length,
    private_count: properties.filter(p => p.is_private === true).length,
    broker_count: properties.filter(p => p.is_private === false).length,
    unknown_count: properties.filter(p => p.is_private === null).length,
  };
}
