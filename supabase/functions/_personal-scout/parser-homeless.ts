/**
 * Homeless Parser - Personal Scout Version
 * 
 * ISOLATED COPY - Does not modify production code
 * Uses text-based extraction for robustness against variable HTML layouts
 */

import { load as cheerioLoad } from "npm:cheerio@1.0.0";
import {
  extractPrice,
  extractRooms,
  extractFloor,
  extractSize,
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
  
  console.log(`[personal-scout/parser-homeless] Starting parse for ${propertyType}`);
  
  const rows = $('tr[type="ad"]');
  console.log(`[personal-scout/parser-homeless] Found ${rows.length} potential property rows`);
  
  rows.each((index, element) => {
    try {
      const $row = $(element);
      const tds = $row.find('td');
      
      if (tds.length < 5) {
        errors.push(`Row ${index}: Not enough cells (${tds.length})`);
        return;
      }
      
      const rowId = $row.attr('id') || '';
      const numericId = rowId.replace('ad_', '') || `${index}`;
      
      // Get full row text for robust extraction
      const fullRowText = $row.text();
      
      // Extract data from full row text (more robust than fixed columns)
      const price = extractPrice(fullRowText);
      const rooms = extractRooms(fullRowText);
      const floor = extractFloor(fullRowText);
      const size = extractSize(fullRowText);
      
      // Try to extract structured data from cells when available
      // But use flexible detection instead of fixed column indices
      let cityText = '';
      let neighborhoodText = '';
      let streetText = '';
      let propertyTypeText = '';
      
      // Scan cells for content patterns
      tds.each((cellIndex: number, cell: any) => {
        const cellText = cleanText($(cell).text());
        if (!cellText) return;
        
        // Property type detection
        if (/דירה|פנטהאוז|סטודיו|קוטג'?|בית/.test(cellText) && !propertyTypeText) {
          propertyTypeText = cellText;
        }
        // City detection (common Israeli cities)
        else if (/תל.?אביב|רמת.?גן|גבעתיים|הרצליה|רעננה|חולון|בת.?ים|ראשון|פתח.?תקווה|ירושלים|חיפה|באר.?שבע|נתניה|אשדוד|כפר.?סבא|רחובות|הוד.?השרון|מודיעין|נס.?ציונה|רמת.?השרון|גבעת.?שמואל/.test(cellText) && !cityText) {
          cityText = cellText;
        }
        // Street detection (Hebrew text that's not a city)
        else if (cellText.length > 3 && /[א-ת]/.test(cellText) && !streetText && cellIndex > 1) {
          // Could be street or neighborhood
          if (!neighborhoodText) {
            neighborhoodText = cellText;
          } else if (!streetText) {
            streetText = cellText;
          }
        }
      });
      
      // Extract link from row
      let sourceUrl = '';
      const linkElement = $row.find('a[href*="homeless.co.il"]').first();
      if (linkElement.length) {
        sourceUrl = linkElement.attr('href') || '';
      } else {
        const anyLink = $row.find('a').first().attr('href') || '';
        if (anyLink.includes('homeless') || anyLink.startsWith('/')) {
          sourceUrl = anyLink.startsWith('http') ? anyLink : `https://www.homeless.co.il${anyLink}`;
        }
      }
      
      // Normalize city
      const city = extractCity(cityText) || cityText || extractCity(fullRowText) || null;
      
      // Extract neighborhood with city context
      const neighborhood = extractNeighborhood(neighborhoodText, city) || extractNeighborhood(fullRowText, city);
      
      // Build address
      let address: string | null = null;
      if (streetText) {
        address = neighborhoodText 
          ? `${streetText}, ${neighborhoodText}, ${cityText}`
          : `${streetText}, ${cityText}`;
      }
      
      // Build title
      const roomsLabel = rooms ? `${rooms}` : '';
      const title = buildTitle(propertyTypeText, roomsLabel, neighborhood?.label || neighborhoodText || cityText || '');
      
      // Parse entry date from full text
      const entryDate = parseHebrewDate(fullRowText);
      
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
        size,
        floor,
        property_type: propertyType,
        is_private: true, // Homeless is primarily private listings
        entry_date: entryDate,
        raw_data: {
          propertyTypeText,
          cityText,
          neighborhoodText,
          streetText,
          fullRowText: fullRowText.substring(0, 300)
        }
      };
      
      properties.push(property);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push(`Row ${index}: ${errorMessage}`);
    }
  });
  
  const stats = calculateStats(properties);
  
  console.log(`[personal-scout/parser-homeless] Completed: ${properties.length} properties, ${errors.length} errors`);
  console.log(`[personal-scout/parser-homeless] Stats: price=${stats.with_price}, rooms=${stats.with_rooms}, size=${stats.with_size}`);
  
  return {
    success: true,
    properties,
    stats,
    errors: errors.length > 0 ? errors : undefined
  };
}

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
  };
}
