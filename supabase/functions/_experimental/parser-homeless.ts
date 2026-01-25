/**
 * Homeless Parser - No AI
 * 
 * Parses property listings from Homeless.co.il HTML using cheerio.
 * Completely isolated from production code.
 */

import { load as cheerioLoad } from "npm:cheerio@1.0.0";
import {
  extractPrice,
  extractRooms,
  extractFloor,
  extractCity,
  extractNeighborhood,
  cleanText,
  parseHebrewDate,
  generateSourceId,
  type ParsedProperty,
  type ParserResult
} from './parser-utils.ts';

/**
 * Parse Homeless HTML and extract property listings
 */
export function parseHomelessHtml(
  html: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const $ = cheerioLoad(html);
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  console.log(`[Homeless Parser] Starting parse for ${propertyType}`);
  
  // Find all property rows - Homeless uses tr[type="ad"] for listings
  const rows = $('tr[type="ad"]');
  console.log(`[Homeless Parser] Found ${rows.length} potential property rows`);
  
  rows.each((index, element) => {
    try {
      const $row = $(element);
      const tds = $row.find('td');
      
      // Skip if not enough cells
      if (tds.length < 8) {
        errors.push(`Row ${index}: Not enough cells (${tds.length})`);
        return;
      }
      
      // Extract row ID for source_id
      const rowId = $row.attr('id') || '';
      const numericId = rowId.replace('ad_', '') || `${index}`;
      
      // Extract data from table cells
      // Column structure (0-indexed):
      // 0: checkbox, 1: icon, 2: property type, 3: city, 4: neighborhood
      // 5: street, 6: rooms, 7: floor, 8: price, 9: entry date, 10: details link
      
      const propertyTypeText = cleanText($(tds[2]).text());
      const cityText = cleanText($(tds[3]).text());
      const neighborhoodText = cleanText($(tds[4]).text());
      const streetText = cleanText($(tds[5]).text());
      const roomsText = cleanText($(tds[6]).text());
      const floorText = cleanText($(tds[7]).text());
      const priceText = cleanText($(tds[8]).text());
      const entryDateText = tds.length > 9 ? cleanText($(tds[9]).text()) : null;
      
      // Extract link from details column
      let sourceUrl = '';
      const linkElement = $row.find('a[href*="homeless.co.il"]').first();
      if (linkElement.length) {
        sourceUrl = linkElement.attr('href') || '';
      } else {
        // Try to find any link in the row
        const anyLink = $row.find('a').first().attr('href') || '';
        if (anyLink.includes('homeless') || anyLink.startsWith('/')) {
          sourceUrl = anyLink.startsWith('http') ? anyLink : `https://www.homeless.co.il${anyLink}`;
        }
      }
      
      // Normalize city
      const city = extractCity(cityText) || cityText || null;
      
      // Extract neighborhood with city context
      const neighborhood = extractNeighborhood(neighborhoodText, city);
      
      // Build address
      let address: string | null = null;
      if (streetText) {
        address = neighborhoodText 
          ? `${streetText}, ${neighborhoodText}, ${cityText}`
          : `${streetText}, ${cityText}`;
      }
      
      // Build title
      const title = buildTitle(propertyTypeText, roomsText, neighborhoodText || cityText);
      
      // Extract numeric values
      const price = extractPrice(priceText);
      const rooms = extractRooms(roomsText);
      const floor = extractFloor(floorText);
      
      // Parse entry date
      const entryDate = entryDateText ? parseHebrewDate(entryDateText) : null;
      
      // Skip rows with no meaningful data
      if (!price && !rooms && !city) {
        errors.push(`Row ${index}: No meaningful data extracted`);
        return;
      }
      
      const property: ParsedProperty = {
        source: 'homeless',
        source_id: generateSourceId('homeless', sourceUrl, index),
        source_url: sourceUrl || `https://www.homeless.co.il/rent/ad/${numericId}`,
        title,
        city,
        neighborhood: neighborhood?.label || neighborhoodText || null,
        neighborhood_value: neighborhood?.value || null,
        address,
        price,
        rooms,
        size: null, // Homeless doesn't show size in list view
        floor,
        property_type: propertyType,
        is_private: true, // Homeless is primarily private listings
        entry_date: entryDate,
        raw_data: {
          propertyTypeText,
          cityText,
          neighborhoodText,
          streetText,
          roomsText,
          floorText,
          priceText,
          entryDateText
        }
      };
      
      properties.push(property);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push(`Row ${index}: ${errorMessage}`);
    }
  });
  
  // Calculate statistics
  const stats = calculateStats(properties);
  
  console.log(`[Homeless Parser] Completed: ${properties.length} properties, ${errors.length} errors`);
  
  return {
    success: true,
    properties,
    stats,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Build a descriptive title for the property
 */
function buildTitle(
  propertyType: string,
  rooms: string,
  location: string
): string {
  const parts: string[] = [];
  
  if (propertyType) {
    parts.push(propertyType);
  }
  
  if (rooms) {
    parts.push(`${rooms} חדרים`);
  }
  
  if (location) {
    parts.push(`ב${location}`);
  }
  
  return parts.join(' ') || 'נכס להשכרה';
}

/**
 * Calculate extraction statistics
 */
function calculateStats(properties: ParsedProperty[]): ParserResult['stats'] {
  const total = properties.length;
  
  return {
    total_found: total,
    with_price: properties.filter(p => p.price !== null).length,
    with_rooms: properties.filter(p => p.rooms !== null).length,
    with_address: properties.filter(p => p.address !== null).length,
    with_size: properties.filter(p => p.size !== null).length,
    with_floor: properties.filter(p => p.floor !== null).length,
    with_neighborhood: properties.filter(p => p.neighborhood !== null).length,
    private_count: properties.filter(p => p.is_private).length,
    broker_count: properties.filter(p => !p.is_private).length,
    extraction_rates: {
      price: total > 0 ? Math.round((properties.filter(p => p.price !== null).length / total) * 100) : 0,
      rooms: total > 0 ? Math.round((properties.filter(p => p.rooms !== null).length / total) * 100) : 0,
      floor: total > 0 ? Math.round((properties.filter(p => p.floor !== null).length / total) * 100) : 0,
      neighborhood: total > 0 ? Math.round((properties.filter(p => p.neighborhood !== null).length / total) * 100) : 0,
    }
  };
}

/**
 * Alternative parser for Homeless markdown/text content
 * Used when HTML structure is not available (e.g., Firecrawl returns markdown)
 */
export function parseHomelessMarkdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  console.log(`[Homeless MD Parser] Starting markdown parse`);
  
  // Split by property patterns - look for price patterns as separators
  const pricePattern = /(?:₪|ש"ח|שח)\s*[\d,]+|[\d,]+\s*(?:₪|ש"ח|שח)/g;
  
  // Find all lines that might be property listings
  const lines = markdown.split('\n');
  let currentProperty: Partial<ParsedProperty> | null = null;
  let propertyIndex = 0;
  
  for (const line of lines) {
    const trimmedLine = cleanText(line);
    if (!trimmedLine) continue;
    
    // Check if line contains a price (likely start of new property)
    const priceMatch = trimmedLine.match(pricePattern);
    if (priceMatch) {
      // Save previous property if exists
      if (currentProperty && currentProperty.price) {
        properties.push(currentProperty as ParsedProperty);
      }
      
      // Start new property
      const price = extractPrice(trimmedLine);
      const rooms = extractRooms(trimmedLine);
      const city = extractCity(trimmedLine);
      const neighborhood = extractNeighborhood(trimmedLine, city);
      
      currentProperty = {
        source: 'homeless',
        source_id: generateSourceId('homeless', '', propertyIndex),
        source_url: '',
        title: '',
        city,
        neighborhood: neighborhood?.label || null,
        neighborhood_value: neighborhood?.value || null,
        address: null,
        price,
        rooms,
        size: null,
        floor: extractFloor(trimmedLine),
        property_type: propertyType,
        is_private: true,
        entry_date: null
      };
      
      propertyIndex++;
    } else if (currentProperty) {
      // Enhance current property with additional info from this line
      if (!currentProperty.city) {
        currentProperty.city = extractCity(trimmedLine);
      }
      if (!currentProperty.rooms) {
        currentProperty.rooms = extractRooms(trimmedLine);
      }
      if (!currentProperty.floor) {
        currentProperty.floor = extractFloor(trimmedLine);
      }
    }
  }
  
  // Don't forget last property
  if (currentProperty && currentProperty.price) {
    properties.push(currentProperty as ParsedProperty);
  }
  
  const stats = calculateStats(properties);
  
  console.log(`[Homeless MD Parser] Completed: ${properties.length} properties`);
  
  return {
    success: true,
    properties,
    stats,
    errors: errors.length > 0 ? errors : undefined
  };
}
