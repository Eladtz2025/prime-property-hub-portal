/**
 * Homeless Parser - Personal Scout Version
 * 
 * ISOLATED COPY - Does not modify production code
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
  
  console.log(`[personal-scout/parser-homeless] Starting parse for ${propertyType}`);
  
  const rows = $('tr[type="ad"]');
  console.log(`[personal-scout/parser-homeless] Found ${rows.length} potential property rows`);
  
  rows.each((index, element) => {
    try {
      const $row = $(element);
      const tds = $row.find('td');
      
      if (tds.length < 8) {
        errors.push(`Row ${index}: Not enough cells (${tds.length})`);
        return;
      }
      
      const rowId = $row.attr('id') || '';
      const numericId = rowId.replace('ad_', '') || `${index}`;
      
      const propertyTypeText = cleanText($(tds[2]).text());
      const cityText = cleanText($(tds[3]).text());
      const neighborhoodText = cleanText($(tds[4]).text());
      const streetText = cleanText($(tds[5]).text());
      const roomsText = cleanText($(tds[6]).text());
      const floorText = cleanText($(tds[7]).text());
      const priceText = cleanText($(tds[8]).text());
      const entryDateText = tds.length > 9 ? cleanText($(tds[9]).text()) : null;
      
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
      
      const city = extractCity(cityText) || cityText || null;
      const neighborhood = extractNeighborhood(neighborhoodText, city);
      
      let address: string | null = null;
      if (streetText) {
        address = neighborhoodText 
          ? `${streetText}, ${neighborhoodText}, ${cityText}`
          : `${streetText}, ${cityText}`;
      }
      
      const title = buildTitle(propertyTypeText, roomsText, neighborhoodText || cityText);
      
      const price = extractPrice(priceText);
      const rooms = extractRooms(roomsText);
      const floor = extractFloor(floorText);
      const entryDate = entryDateText ? parseHebrewDate(entryDateText) : null;
      
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
        size: null,
        floor,
        property_type: propertyType,
        is_private: true,
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
  
  const stats = calculateStats(properties);
  
  console.log(`[personal-scout/parser-homeless] Completed: ${properties.length} properties, ${errors.length} errors`);
  
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
