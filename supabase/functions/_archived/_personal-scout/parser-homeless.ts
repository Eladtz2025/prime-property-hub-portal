/**
 * Homeless Parser - Personal Scout Version
 * 
 * ISOLATED COPY - Does not modify production code
 * Uses text-based extraction for robustness against variable HTML layouts
 */

import { load as cheerioLoad } from "npm:cheerio@1.0.0";
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  extractPrice,
  extractRooms,
  extractFloor,
  // NOTE: extractSize not imported - Size is NOT available in Homeless search results
  extractCity,
  extractNeighborhood,
  cleanText,
  parseHebrewDate,
  generateSourceId,
  type ParsedProperty,
  type ParserResult
} from './parser-utils.ts';
import { lookupNeighborhoodByStreet } from '../_experimental/street-lookup.ts';

/**
 * Parse Homeless HTML and extract property listings
 */
// Default city - since we're scanning Tel Aviv, default to it
const DEFAULT_CITY = 'תל אביב יפו';

export async function parseHomelessHtml(
  html: string,
  propertyType: 'rent' | 'sale',
  supabase?: SupabaseClient
): Promise<ParserResult> {
  const $ = cheerioLoad(html);
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  console.log(`[personal-scout/parser-homeless] Starting parse for ${propertyType}`);
  
  const rows = $('tr[type="ad"]');
  console.log(`[personal-scout/parser-homeless] Found ${rows.length} potential property rows`);
  
  // Process rows - use for...of to support async/await
  const rowsArray = rows.toArray();
  for (let index = 0; index < rowsArray.length; index++) {
    const element = rowsArray[index];
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
      
      // ========== PRIMARY: Direct column extraction (more reliable) ==========
      // Homeless table ACTUAL column mapping (verified from HTML):
      // [0]=checkbox, [1]=image, [2]=type, [3]=city, [4]=neighborhood, [5]=street
      // [6]=rooms, [7]=floor, [8]=price, [9]=entry, [10]=date
      // NOTE: There is NO size column in the Homeless table!
      
      let price: number | null = null;
      let rooms: number | null = null;
      let floor: number | null = null;
      
      // Size: NOT available in Homeless search results table
      // It only appears in individual property detail pages
      const size: number | null = null;
      
      // Rooms (column 6) - extract number, range 1-20
      if (tds.length > 6) {
        const roomsCell = cleanText($(tds[6]).text());
        // Relaxed regex - allow number anywhere in cell (not just standalone)
        const roomsMatch = roomsCell.match(/(\d+(?:[.,]\d)?)/);
        if (roomsMatch) {
          const num = parseFloat(roomsMatch[1].replace(',', '.'));
          if (num >= 1 && num <= 20) rooms = num;
        }
      }
      
      // Floor (column 7) - number or "קרקע", range -5 to 100
      if (tds.length > 7) {
        const floorCell = cleanText($(tds[7]).text());
        if (/קרקע|ground/i.test(floorCell)) {
          floor = 0;
        } else {
          const floorMatch = floorCell.match(/^(-?\d+)$/);
          if (floorMatch) {
            const num = parseInt(floorMatch[1], 10);
            if (num >= -5 && num <= 100) floor = num;
          }
        }
      }
      
      // Price (column 8) - PRIORITY extraction to avoid phone numbers
      // Format like "4,000 ₪" or "8,500"
      if (tds.length > 8) {
        const priceCell = cleanText($(tds[8]).text());
        const cleaned = priceCell.replace(/[^\d]/g, '');
        if (cleaned) {
          const num = parseInt(cleaned, 10);
          // Validate price range based on property type
          if (propertyType === 'rent') {
            if (num >= 500 && num <= 50000) price = num;
          } else {
            if (num >= 100000 && num <= 50000000) price = num;
          }
        }
      }
      
      // ========== FALLBACK: Text-based extraction ==========
      // Only use if column extraction failed
      if (!rooms) {
        // Try to find rooms with Hebrew pattern in full text
        const roomsFallback = fullRowText.match(/(\d+(?:\.\d)?)\s*(?:חדרים|חד)/);
        if (roomsFallback) {
          const num = parseFloat(roomsFallback[1]);
          if (num >= 1 && num <= 20) rooms = num;
        }
        // Last resort: use generic extractor
        if (!rooms) rooms = extractRooms(fullRowText);
      }
      if (!floor) floor = extractFloor(fullRowText);
      if (!price) price = extractPrice(fullRowText);
      
      // ========== CITY: Direct column extraction (td[3]) ==========
      let cityText = '';
      let neighborhoodText = '';
      let streetText = '';
      let propertyTypeText = '';
      
      // Extract city directly from column 3 (most reliable)
      if (tds.length > 3) {
        cityText = cleanText($(tds[3]).text());
      }
      
      // Extract neighborhood from column 4
      if (tds.length > 4) {
        neighborhoodText = cleanText($(tds[4]).text());
      }
      
      // Extract street from column 5
      if (tds.length > 5) {
        streetText = cleanText($(tds[5]).text());
      }
      
      // Extract property type from column 2
      if (tds.length > 2) {
        const typeCell = cleanText($(tds[2]).text());
        if (/דירה|פנטהאוז|סטודיו|קוטג'?|בית|דופלקס|גג|מיני/.test(typeCell)) {
          propertyTypeText = typeCell;
        }
      }
      
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
      
      // Normalize city - try column first, then pattern matching, then default to Tel Aviv
      const city = extractCity(cityText) || extractCity(neighborhoodText) || extractCity(fullRowText) || DEFAULT_CITY;
      
      // Extract neighborhood with city context - search in multiple sources
      let neighborhood = extractNeighborhood(neighborhoodText, city);
      if (!neighborhood) {
        neighborhood = extractNeighborhood(streetText, city);
      }
      if (!neighborhood) {
        neighborhood = extractNeighborhood(fullRowText, city);
      }
      
      // NEW: Fallback to street_neighborhoods database lookup (1,245 streets mapped!)
      if (!neighborhood && streetText && supabase && city === 'תל אביב יפו') {
        try {
          const streetLookup = await lookupNeighborhoodByStreet(supabase, streetText, city);
          if (streetLookup) {
            neighborhood = {
              label: streetLookup.neighborhood,
              value: streetLookup.neighborhood_value
            };
            console.log(`[personal-scout/parser-homeless] DB lookup: "${streetText}" → ${streetLookup.neighborhood}`);
          }
        } catch (lookupErr) {
          // Silent fail - continue with regex-only results
          console.warn(`[personal-scout/parser-homeless] Street lookup failed for "${streetText}":`, lookupErr);
        }
      }
      
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
  }
  
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

/**
 * Markdown Fallback Parser for Homeless
 * Used when HTML structure doesn't contain expected tr[type="ad"] elements
 * (e.g., when Firecrawl returns onlyMainContent)
 */
export function parseHomelessMarkdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  console.log(`[personal-scout/parser-homeless] Markdown fallback for ${propertyType}, length=${markdown.length}`);
  
  // Split by price patterns to identify property blocks
  // Homeless prices appear as "X,XXX ₪" or similar
  const pricePattern = /(\d{1,3}(?:,\d{3})*)\s*₪/g;
  const priceMatches = [...markdown.matchAll(pricePattern)];
  
  console.log(`[personal-scout/parser-homeless] Found ${priceMatches.length} potential price matches`);
  
  // Process each potential property block
  for (let i = 0; i < priceMatches.length; i++) {
    try {
      const match = priceMatches[i];
      const priceNum = parseInt(match[1].replace(/,/g, ''), 10);
      
      // Validate price range
      let price: number | null = null;
      if (propertyType === 'rent') {
        if (priceNum >= 500 && priceNum <= 50000) price = priceNum;
      } else {
        if (priceNum >= 100000 && priceNum <= 50000000) price = priceNum;
      }
      
      if (!price) continue;
      
      // Get context around this price (200 chars before, 100 after)
      const startIdx = Math.max(0, (match.index || 0) - 200);
      const endIdx = Math.min(markdown.length, (match.index || 0) + 100);
      const context = markdown.substring(startIdx, endIdx);
      
      // Extract rooms
      let rooms: number | null = null;
      const roomsMatch = context.match(/(\d+(?:\.\d)?)\s*(?:חדרים|חד)/);
      if (roomsMatch) {
        const num = parseFloat(roomsMatch[1]);
        if (num >= 1 && num <= 20) rooms = num;
      }
      
      // Extract floor
      let floor: number | null = null;
      const floorMatch = context.match(/קומה\s*(\d+)|קרקע/);
      if (floorMatch) {
        floor = floorMatch[1] ? parseInt(floorMatch[1], 10) : 0;
      }
      
      // Extract city
      const city = extractCity(context) || DEFAULT_CITY;
      
      // Extract neighborhood
      const neighborhood = extractNeighborhood(context, city);
      
      // Skip duplicates (same price within same context likely means same property)
      const isDuplicate = properties.some(p => 
        p.price === price && 
        p.rooms === rooms && 
        p.neighborhood === neighborhood?.label
      );
      if (isDuplicate) continue;
      
      // Build property
      const property: ParsedProperty = {
        source: 'homeless',
        source_id: generateSourceId('homeless', '', i),
        source_url: 'https://www.homeless.co.il',
        title: `${rooms ? `${rooms} חדרים` : 'דירה'} ${neighborhood?.label ? `ב${neighborhood.label}` : `ב${city}`}`,
        city,
        neighborhood: neighborhood?.label || null,
        neighborhood_value: neighborhood?.value || null,
        address: null,
        price,
        rooms,
        size: null, // Size not available in Homeless search results
        floor,
        property_type: propertyType,
        is_private: true,
        entry_date: null,
        raw_data: {
          context: context.substring(0, 200),
          parser: 'markdown-fallback'
        }
      };
      
      properties.push(property);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push(`Price block ${i}: ${errorMessage}`);
    }
  }
  
  const stats = calculateStats(properties);
  
  console.log(`[personal-scout/parser-homeless] Markdown parsed: ${properties.length} properties`);
  console.log(`[personal-scout/parser-homeless] Stats: price=${stats.with_price}, rooms=${stats.with_rooms}`);
  
  return {
    success: true,
    properties,
    stats,
    errors: errors.length > 0 ? errors : undefined
  };
}
