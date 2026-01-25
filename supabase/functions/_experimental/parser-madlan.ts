/**
 * Madlan Property Parser
 * 
 * EXPERIMENTAL - Completely isolated from production code
 * Parses property listings from Madlan HTML/Markdown content
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

// ============================================
// Madlan HTML Parser
// ============================================

/**
 * Parse Madlan property listings from HTML content
 */
export function parseMadlanHtml(
  html: string, 
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  const $ = cheerio.load(html);
  
  // Madlan uses various card structures
  const propertyCards = $('[data-auto="property-card"], [class*="PropertyCard"], [class*="property-card"], [class*="listing-card"]');
  
  console.log(`[parser-madlan] Found ${propertyCards.length} property cards`);
  
  // If no cards found, try alternative selectors
  if (propertyCards.length === 0) {
    // Try generic approach - look for price patterns
    const allText = $.text();
    if (allText.includes('₪') || allText.includes('חדרים') || allText.includes('חד׳')) {
      console.log('[parser-madlan] No cards found, falling back to markdown parsing');
      return parseMadlanMarkdown(html, propertyType);
    }
  }
  
  propertyCards.each((i, el) => {
    try {
      const card = $(el);
      const fullText = card.text();
      
      // Extract price (Madlan format: X,XXX ₪ or ₪X,XXX)
      const priceText = card.find('[class*="price"], [class*="Price"]').first().text();
      const price = extractPrice(priceText) || extractPrice(fullText);
      
      // Extract address/location
      const addressText = card.find('[class*="address"], [class*="Address"], [class*="location"]').first().text();
      const address = cleanText(addressText);
      
      // Extract city and neighborhood
      const city = extractCity(address) || extractCity(fullText) || 'תל אביב יפו';
      const neighborhood = extractNeighborhood(address, city) || extractNeighborhood(fullText, city);
      
      // Extract rooms, size, floor
      const rooms = extractRooms(fullText);
      const size = extractSize(fullText);
      const floor = extractFloor(fullText);
      
      // Extract URL
      const linkHref = card.find('a[href*="/item/"], a[href*="/nadlan/"]').first().attr('href') || '';
      const sourceUrl = linkHref.startsWith('http') ? linkHref : (linkHref ? `https://www.madlan.co.il${linkHref}` : '');
      
      // Detect broker
      const isBroker = detectBroker(fullText);
      
      // Build title
      const title = buildTitle(propertyType, rooms, neighborhood?.label || city);
      
      // Skip if no meaningful data
      if (!price && !rooms && !address) {
        errors.push(`Card ${i}: No meaningful data extracted`);
        return;
      }
      
      properties.push({
        source: 'madlan',
        source_id: generateSourceId('madlan', sourceUrl || fullText, i),
        source_url: sourceUrl,
        title,
        city,
        neighborhood: neighborhood?.label || null,
        neighborhood_value: neighborhood?.value || null,
        address: address || null,
        price,
        rooms,
        size,
        floor,
        property_type: propertyType,
        is_private: !isBroker,
        entry_date: null,
        raw_text: fullText.substring(0, 500)
      });
      
    } catch (error) {
      errors.push(`Card ${i}: ${error.message}`);
    }
  });
  
  return {
    success: true,
    properties,
    stats: calculateStats(properties),
    errors
  };
}

// ============================================
// Madlan Markdown Parser
// ============================================

/**
 * Parse Madlan property listings from Markdown/text content
 * 
 * Madlan markdown patterns:
 * - Price: "X,XXX ₪" or "₪ X,XXX"
 * - Rooms: "X חד׳" or "X חדרים"  
 * - Size: "X מ"ר" or "X מ״ר"
 * - Floor: "קומה X"
 * - Address: "רחוב, שכונה, עיר"
 */
export function parseMadlanMarkdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  // Split by lines
  const lines = markdown.split('\n');
  
  // Patterns to identify listing blocks
  const pricePattern = /[\d,]+\s*₪|₪\s*[\d,]+/;
  const roomsPattern = /(\d+(?:\.\d)?)\s*(?:חד׳|חדרים|חד')/;
  
  let currentProperty: Partial<ParsedProperty> | null = null;
  let currentRawText = '';
  let linesSincePrice = 0;
  
  for (const line of lines) {
    const cleanLine = cleanText(line);
    if (!cleanLine || cleanLine.length < 3) continue;
    
    // Check if this line has a price (potential new listing)
    const hasPrice = pricePattern.test(cleanLine);
    const hasRooms = roomsPattern.test(cleanLine);
    
    // New listing detection: price or rooms+address pattern
    if (hasPrice || (hasRooms && linesSincePrice > 5)) {
      // Save previous property if exists
      if (currentProperty && (currentProperty.price || currentProperty.rooms)) {
        properties.push(finalizeProperty(currentProperty, currentRawText, propertyType, properties.length));
      }
      
      // Start new property
      currentProperty = {
        price: extractPrice(cleanLine),
        rooms: extractRooms(cleanLine),
        size: extractSize(cleanLine),
        floor: extractFloor(cleanLine),
        city: extractCity(cleanLine),
        is_private: !detectBroker(cleanLine)
      };
      
      // Try to extract neighborhood
      const neighborhood = extractNeighborhood(cleanLine, currentProperty.city || null);
      if (neighborhood) {
        currentProperty.neighborhood = neighborhood.label;
        currentProperty.neighborhood_value = neighborhood.value;
      }
      
      // Extract address from bold patterns like **[Address]**
      const boldMatch = cleanLine.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        currentProperty.address = boldMatch[1].trim();
      }
      
      currentRawText = cleanLine;
      linesSincePrice = 0;
      
    } else if (currentProperty) {
      // Add to current property
      currentRawText += ' ' + cleanLine;
      linesSincePrice++;
      
      // Try to extract missing fields
      if (!currentProperty.rooms) currentProperty.rooms = extractRooms(cleanLine);
      if (!currentProperty.size) currentProperty.size = extractSize(cleanLine);
      if (!currentProperty.floor) currentProperty.floor = extractFloor(cleanLine);
      if (!currentProperty.city) currentProperty.city = extractCity(cleanLine);
      
      if (!currentProperty.neighborhood) {
        const neighborhood = extractNeighborhood(cleanLine, currentProperty.city || null);
        if (neighborhood) {
          currentProperty.neighborhood = neighborhood.label;
          currentProperty.neighborhood_value = neighborhood.value;
        }
      }
      
      // Extract address from bold text
      if (!currentProperty.address) {
        const boldMatch = cleanLine.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
          currentProperty.address = boldMatch[1].trim();
        }
      }
      
      // Broker detection
      if (currentProperty.is_private !== false && detectBroker(cleanLine)) {
        currentProperty.is_private = false;
      }
    } else {
      linesSincePrice++;
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
  const city = partial.city || 'תל אביב יפו';
  const title = buildTitle(propertyType, partial.rooms || null, partial.neighborhood || city);
  
  return {
    source: 'madlan',
    source_id: generateSourceId('madlan', rawText, index),
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
