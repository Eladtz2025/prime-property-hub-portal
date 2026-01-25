/**
 * Yad2 Property Parser
 * 
 * EXPERIMENTAL - Completely isolated from production code
 * Parses property listings from Yad2 HTML/Markdown content
 */

import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';
import { 
  extractPrice, 
  extractRooms, 
  extractSize, 
  extractFloor,
  extractCity,
  extractNeighborhood,
  detectBroker,
  cleanText,
  generateSourceId,
  type ParsedProperty,
  type ParserResult
} from './parser-utils.ts';
import { 
  lookupNeighborhoodByStreet, 
  extractStreetFromAddress,
  createSupabaseClient,
  type StreetLookupResult
} from './street-lookup.ts';

// ============================================
// Yad2 HTML Parser
// ============================================

/**
 * Parse Yad2 property listings from HTML content
 */
export async function parseYad2Html(
  html: string, 
  propertyType: 'rent' | 'sale',
  useStreetLookup: boolean = true
): Promise<ParserResult> {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  const $ = cheerio.load(html);
  
  // Initialize supabase client for street lookup
  let supabase = null;
  if (useStreetLookup) {
    try {
      supabase = createSupabaseClient();
    } catch (e) {
      console.warn('[parser-yad2] Could not create supabase client for street lookup');
    }
  }
  
  // Yad2 uses various selectors for feed items
  const feedItems = $('[data-testid="feed-item"], .feeditem, .feed_item, [class*="feedItem"]');
  
  console.log(`[parser-yad2] Found ${feedItems.length} feed items`);
  
  for (let i = 0; i < feedItems.length; i++) {
    try {
      const item = feedItems.eq(i);
      
      // Extract price
      const priceText = item.find('[data-testid="price"], .price, [class*="price"]').first().text();
      const price = extractPrice(priceText);
      
      // Extract address/location
      const addressText = item.find('[data-testid="address"], .item_data_address, [class*="address"], [class*="location"]').first().text();
      const address = cleanText(addressText);
      
      // Extract city and neighborhood from address
      const city = extractCity(address);
      let neighborhood = extractNeighborhood(address, city);
      let neighborhoodConfidence = neighborhood ? 70 : 0;
      
      // Try street lookup if no neighborhood found and city is available
      if (!neighborhood && city && supabase) {
        const streetName = extractStreetFromAddress(address);
        if (streetName) {
          const streetLookup = await lookupNeighborhoodByStreet(supabase, streetName, city);
          if (streetLookup) {
            neighborhood = { 
              value: streetLookup.neighborhood_value, 
              label: streetLookup.neighborhood 
            };
            neighborhoodConfidence = streetLookup.confidence;
          }
        }
      }
      
      // Extract rooms, size, floor from data rows
      const dataRowText = item.find('.data_row, [class*="dataRow"], [class*="itemInfo"]').text();
      const rooms = extractRooms(dataRowText) || extractRooms(item.text());
      const size = extractSize(dataRowText) || extractSize(item.text());
      const floor = extractFloor(dataRowText) || extractFloor(item.text());
      
      // Extract listing URL
      const linkHref = item.find('a[href*="/item/"], a[href*="/realestate/"]').first().attr('href') || '';
      const sourceUrl = linkHref.startsWith('http') ? linkHref : `https://www.yad2.co.il${linkHref}`;
      
      // Detect if private or broker
      const fullText = item.text();
      const isBroker = detectBroker(fullText);
      
      // Build title
      const title = buildTitle(propertyType, rooms, address || city || 'לא ידוע');
      
      // Skip if no meaningful data
      if (!price && !rooms && !address) {
        errors.push(`Item ${i}: No meaningful data extracted`);
        continue;
      }
      
      properties.push({
        source: 'yad2',
        source_id: generateSourceId('yad2', sourceUrl, i),
        source_url: sourceUrl,
        title,
        city: city || 'לא ידוע',
        neighborhood: neighborhood?.label || null,
        neighborhood_value: neighborhood?.value || null,
        address,
        price,
        rooms,
        size,
        floor,
        property_type: propertyType,
        is_private: !isBroker,
        entry_date: null,
        raw_text: fullText.substring(0, 500) // For debugging
      });
      
    } catch (error) {
      errors.push(`Item ${i}: ${error.message}`);
    }
  }
  
  return {
    success: true,
    properties,
    stats: calculateStats(properties),
    errors
  };
}

// ============================================
// Yad2 Markdown Parser
// ============================================

/**
 * Parse Yad2 property listings from Markdown/text content
 * 
 * Yad2 markdown patterns:
 * - Price line: "₪ X,XXX" (standalone line)
 * - Details line: "**[Address][PropertyType], [Neighborhood], [City][Rooms] חדרים • קומה X • XX מ״ר**"
 * - Separator: "•" between rooms/floor/size
 */
export function parseYad2Markdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  const lines = markdown.split('\n');
  
  // Pattern for price line (standalone)
  const priceLinePattern = /^₪\s*[\d,]+$/;
  // Pattern for details in bold
  const detailsPattern = /\*\*([^*]+)\*\*/;
  // Pattern for rooms with dot separator
  const roomsWithDotPattern = /(\d+(?:\.\d)?)\s*חדרים/;
  const floorPattern = /קומה\s*(?:‎)?(\d+|קרקע)/;
  const sizePattern = /(\d+)\s*מ[״"']?ר/;
  
  let currentProperty: Partial<ParsedProperty> | null = null;
  let currentRawText = '';
  let pendingPrice: number | null = null;
  
  for (const line of lines) {
    const cleanLine = cleanText(line);
    if (!cleanLine || cleanLine.length < 2) continue;
    
    // Check if this is a standalone price line
    if (priceLinePattern.test(cleanLine)) {
      // Save previous property if exists
      if (currentProperty && (currentProperty.price || currentProperty.rooms)) {
        properties.push(finalizeProperty(currentProperty, currentRawText, propertyType, properties.length));
      }
      
      pendingPrice = extractPrice(cleanLine);
      currentProperty = { price: pendingPrice };
      currentRawText = cleanLine;
      continue;
    }
    
    // Check for bold details line (main property info)
    const boldMatch = cleanLine.match(detailsPattern);
    if (boldMatch && pendingPrice) {
      const details = boldMatch[1];
      
      // Parse the details string
      // Format: "[Address], [Neighborhood], [City][Rooms] חדרים • קומה X • XX מ״ר"
      
      // Extract rooms
      const roomsMatch = details.match(roomsWithDotPattern);
      if (roomsMatch) {
        currentProperty!.rooms = parseFloat(roomsMatch[1]);
      }
      
      // Extract floor
      const floorMatch = details.match(floorPattern);
      if (floorMatch) {
        currentProperty!.floor = floorMatch[1] === 'קרקע' ? 0 : parseInt(floorMatch[1], 10);
      }
      
      // Extract size
      const sizeMatch = details.match(sizePattern);
      if (sizeMatch) {
        currentProperty!.size = parseInt(sizeMatch[1], 10);
      }
      
      // Extract city
      currentProperty!.city = extractCity(details) || 'תל אביב יפו';
      
      // Extract neighborhood
      const neighborhood = extractNeighborhood(details, currentProperty!.city);
      if (neighborhood) {
        currentProperty!.neighborhood = neighborhood.label;
        currentProperty!.neighborhood_value = neighborhood.value;
      }
      
      // Extract address (part before the comma)
      const addressParts = details.split(',');
      if (addressParts.length > 0) {
        // Remove property type suffix (דירה, דירת גן, etc.)
        let addr = addressParts[0].trim();
        addr = addr.replace(/דירה|דירת גן|פנטהאוז|סטודיו|מיני פנטהאוז/g, '').trim();
        if (addr) {
          currentProperty!.address = addr;
        }
      }
      
      currentRawText += ' ' + cleanLine;
      
      // Finalize this property since we have all data
      if (currentProperty && currentProperty.price) {
        properties.push(finalizeProperty(currentProperty, currentRawText, propertyType, properties.length));
        currentProperty = null;
        pendingPrice = null;
        currentRawText = '';
      }
      
      continue;
    }
    
    // Handle non-bold lines with property data (separator pattern)
    if (cleanLine.includes('•') && currentProperty) {
      // Split by dot separator
      const parts = cleanLine.split('•').map(p => p.trim());
      
      for (const part of parts) {
        if (!currentProperty.rooms) {
          const rooms = extractRooms(part);
          if (rooms) currentProperty.rooms = rooms;
        }
        if (currentProperty.floor === undefined) {
          const floor = extractFloor(part);
          if (floor !== null) currentProperty.floor = floor;
        }
        if (!currentProperty.size) {
          const size = extractSize(part);
          if (size) currentProperty.size = size;
        }
      }
      
      currentRawText += ' ' + cleanLine;
      continue;
    }
    
    // General line processing for current property
    if (currentProperty) {
      currentRawText += ' ' + cleanLine;
      
      if (!currentProperty.rooms) currentProperty.rooms = extractRooms(cleanLine);
      if (!currentProperty.size) currentProperty.size = extractSize(cleanLine);
      if (currentProperty.floor === undefined) currentProperty.floor = extractFloor(cleanLine);
      if (!currentProperty.city) currentProperty.city = extractCity(cleanLine);
      
      if (!currentProperty.neighborhood) {
        const neighborhood = extractNeighborhood(cleanLine, currentProperty.city || null);
        if (neighborhood) {
          currentProperty.neighborhood = neighborhood.label;
          currentProperty.neighborhood_value = neighborhood.value;
        }
      }
      
      if (currentProperty.is_private !== false && detectBroker(cleanLine)) {
        currentProperty.is_private = false;
      }
    }
  }
  
  // Don't forget last property
  if (currentProperty && (currentProperty.price || currentProperty.rooms)) {
    properties.push(finalizeProperty(currentProperty, currentRawText, propertyType, properties.length));
  }
  
  return {
    success: true,
    properties,
    stats: calculateStats(properties),
    errors
  };
}

// ============================================
// Helper Functions
// ============================================

function finalizeProperty(
  partial: Partial<ParsedProperty>,
  rawText: string,
  propertyType: 'rent' | 'sale',
  index: number
): ParsedProperty {
  const city = partial.city || 'לא ידוע';
  const title = buildTitle(propertyType, partial.rooms || null, partial.address || city);
  
  return {
    source: 'yad2',
    source_id: generateSourceId('yad2', rawText, index),
    source_url: '',
    title,
    city,
    neighborhood: partial.neighborhood || null,
    neighborhood_value: partial.neighborhood_value || null,
    address: partial.address || null,
    price: partial.price || null,
    rooms: partial.rooms || null,
    size: partial.size || null,
    floor: partial.floor || null,
    property_type: propertyType,
    is_private: partial.is_private ?? true,
    entry_date: null,
    raw_text: rawText.substring(0, 500)
  };
}

function buildTitle(propertyType: string, rooms: number | null, location: string): string {
  const typeLabel = propertyType === 'rent' ? 'להשכרה' : 'למכירה';
  const roomsLabel = rooms ? `${rooms} חדרים` : '';
  
  if (roomsLabel && location) {
    return `דירה ${roomsLabel} ${typeLabel} ב${location}`;
  } else if (location) {
    return `דירה ${typeLabel} ב${location}`;
  } else if (roomsLabel) {
    return `דירה ${roomsLabel} ${typeLabel}`;
  }
  
  return `דירה ${typeLabel}`;
}

function calculateStats(properties: ParsedProperty[]): ParserResult['stats'] {
  return {
    total_found: properties.length,
    with_price: properties.filter(p => p.price !== null).length,
    with_rooms: properties.filter(p => p.rooms !== null).length,
    with_address: properties.filter(p => p.address !== null).length,
    with_size: properties.filter(p => p.size !== null).length,
    with_floor: properties.filter(p => p.floor !== null).length,
    private_count: properties.filter(p => p.is_private).length,
    broker_count: properties.filter(p => !p.is_private).length,
  };
}
