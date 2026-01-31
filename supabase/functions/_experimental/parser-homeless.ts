/**
 * ⚠️ PRODUCTION CODE - DO NOT MODIFY WITHOUT TESTING ⚠️
 * 
 * Homeless Parser - No AI
 * 
 * Parses property listings from Homeless.co.il HTML using cheerio.
 * This parser is used by the production scout-homeless function.
 * 
 * IMPORTANT: Any changes to this file will affect production scans.
 * Always test thoroughly before deploying.
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
  extractFeatures,
  mergeFeatures,
  cleanText,
  parseHebrewDate,
  generateSourceId,
  type ParsedProperty,
  type ParserResult,
  type PropertyFeatures
} from './parser-utils.ts';
import { lookupNeighborhoodByStreet } from './street-lookup.ts';

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
  
  console.log(`[Homeless Parser] Starting parse for ${propertyType}`);
  
  // Find all property rows - Homeless uses tr[type="ad"] for listings
  const rows = $('tr[type="ad"]');
  console.log(`[Homeless Parser] Found ${rows.length} potential property rows`);
  
  // Process rows - use for...of to support async/await
  const rowsArray = rows.toArray();
  for (let index = 0; index < rowsArray.length; index++) {
    const element = rowsArray[index];
    try {
      const $row = $(element);
      const tds = $row.find('td');
      
      // Skip if not enough cells
      if (tds.length < 5) {
        errors.push(`Row ${index}: Not enough cells (${tds.length})`);
        return;
      }
      
      // Extract row ID for source_id
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
      
      // Rooms (column 6) - standalone number, range 1-20
      if (tds.length > 6) {
        const roomsCell = cleanText($(tds[6]).text());
        const roomsMatch = roomsCell.match(/^(\d+(?:[.,]\d)?)$/);
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
      
      // Price (column 8) - Extract price carefully
      // KNOWN ISSUES:
      // 1. Cell contains mixed text like "3 10,900 01" (rooms + price + ad ID)
      // 2. Years (2025, 2026) are mistaken for prices
      // 3. Room numbers get concatenated with price (e.g., "421,000" = 4 rooms + 21,000)
      // SOLUTION: Multiple strategies with strict validation
      if (tds.length > 8) {
        const $priceCell = $(tds[8]);
        const priceCellText = cleanText($priceCell.text());
        const priceCellHtml = $priceCell.html() || '';
        
        // Filter out years (2020-2030) - these are NOT prices
        const yearPattern = /\b(20[2-3]\d)\b/g;
        const cleanedPriceText = priceCellText.replace(yearPattern, '');
        
        // Strategy 1: Look for price with ₪ symbol (most reliable)
        let priceMatch = priceCellHtml.match(/([\d,]+)\s*₪/) || priceCellHtml.match(/₪\s*([\d,]+)/);
        
        if (priceMatch) {
          const cleaned = priceMatch[1].replace(/,/g, '');
          const num = parseInt(cleaned, 10);
          // Skip if it looks like a year
          if (num < 2000 || num > 2100) {
            if (propertyType === 'rent' && num >= 1000 && num <= 30000) price = num;
            else if (propertyType === 'sale' && num >= 100000 && num <= 50000000) price = num;
          }
        }
        
        // Strategy 2: Find comma-formatted numbers (Israeli style: 10,000 or 5,500)
        if (!price) {
          // Match numbers with comma formatting
          const commaPattern = /\b(\d{1,2},\d{3})\b/g;
          const matches = cleanedPriceText.match(commaPattern) || [];
          
          for (const numStr of matches) {
            const cleaned = numStr.replace(/,/g, '');
            const num = parseInt(cleaned, 10);
            
            // Validate rental price range (1,000 - 30,000)
            if (propertyType === 'rent' && num >= 1000 && num <= 30000) {
              price = num;
              break;
            }
          }
          
          // For sales, look for larger numbers
          if (!price && propertyType === 'sale') {
            const salePattern = /\b(\d{1,3},\d{3},\d{3})\b/g;
            const saleMatches = cleanedPriceText.match(salePattern) || [];
            for (const numStr of saleMatches) {
              const cleaned = numStr.replace(/,/g, '');
              const num = parseInt(cleaned, 10);
              if (num >= 500000 && num <= 50000000) {
                price = num;
                break;
              }
            }
          }
        }
        
        // Strategy 3: Plain number without comma (common for round prices like 5000, 8000)
        if (!price && propertyType === 'rent') {
          // Find all 4-5 digit numbers
          const allNumbers = cleanedPriceText.match(/\b(\d{4,5})\b/g) || [];
          for (const numStr of allNumbers) {
            const num = parseInt(numStr, 10);
            // Skip years (2000-2100) and validate range
            if ((num < 2000 || num > 2100) && num >= 1000 && num <= 30000) {
              price = num;
              break;
            }
          }
        }
      }
      
      // ========== FALLBACK: Text-based extraction for rooms/floor only ==========
      // DO NOT use fallback for price - it grabs sale prices, phone numbers, etc.
      if (!rooms) rooms = extractRooms(fullRowText);
      if (!floor) floor = extractFloor(fullRowText);
      // Price: Leave as null if column extraction failed - don't use unreliable fallback
      
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
            console.log(`[Homeless Parser] DB lookup: "${streetText}" → ${streetLookup.neighborhood}`);
          }
        } catch (lookupErr) {
          // Silent fail - continue with regex-only results
          console.warn(`[Homeless Parser] Street lookup failed for "${streetText}":`, lookupErr);
        }
      }
      
      // Build address
      let address: string | null = null;
      if (streetText) {
        address = neighborhoodText 
          ? `${streetText}, ${neighborhoodText}, ${cityText}`
          : `${streetText}, ${cityText}`;
      }
      
      // Build title - now includes street name for better identification
      const roomsLabel = rooms ? `${rooms}` : '';
      const title = buildTitle(propertyTypeText, roomsLabel, neighborhood?.label || neighborhoodText || cityText || '', streetText || null);
      
      // Parse entry date from full text
      const entryDate = parseHebrewDate(fullRowText);
      
      // Skip rows with no meaningful data
      if (!price && !rooms && !city) {
        errors.push(`Row ${index}: No meaningful data extracted`);
        return;
      }
      
      // Extract features from full row text
      const features = extractFeatures(fullRowText);
      
      // ============================================
      // BROKER DETECTION - Homeless
      // Based on user screenshots:
      // - Broker: Shows "שם הסוכנות:" with agency name
      // - Private: Only "איש קשר:" with first name (no agency)
      // ============================================
      
      // Check for "שם הסוכנות" field (explicit agency name indicator)
      const hasAgencyName = /שם הסוכנות/.test(fullRowText);
      
      // Check for "תיווך" or "סוכנות" labels
      const hasAgencyField = /תיווך|סוכנות/.test(fullRowText);
      
      // Check for 7-digit license number (Israeli broker license)
      const hasLicenseNumber = /\d{7}/.test(fullRowText);
      
      // Check for known broker brand names
      const BROKER_BRANDS = ['רימקס', 'אנגלו סכסון', 're/max', 'remax', 'century 21', 'קולדוול'];
      const fullRowLower = fullRowText.toLowerCase();
      const hasBrokerBrand = BROKER_BRANDS.some(brand => 
        fullRowLower.includes(brand.toLowerCase())
      );
      
      // SIMPLE RULE: Agency name, license, or known brand = broker
      // Otherwise = private
      const isBroker = hasAgencyName || hasAgencyField || hasLicenseNumber || hasBrokerBrand;

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
        is_private: !isBroker, // Check broker keywords instead of assuming private
        entry_date: entryDate,
        features,
        raw_text: fullRowText.substring(0, 500), // Save raw text for future reclassification
        raw_data: {
          propertyTypeText,
          cityText,
          neighborhoodText,
          streetText
        }
      };
      
      properties.push(property);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push(`Row ${index}: ${errorMessage}`);
    }
  }
  
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
 * FIXED: Now includes street name for better identification
 */
function buildTitle(
  propertyType: string,
  rooms: string,
  location: string,
  street: string | null = null
): string {
  const parts: string[] = [];
  
  if (propertyType) {
    parts.push(propertyType);
  }
  
  if (rooms) {
    parts.push(`${rooms} חדרים`);
  }
  
  // Include street in location for better identification
  if (street && location) {
    parts.push(`ב${street}, ${location}`);
  } else if (street) {
    parts.push(`ב${street}`);
  } else if (location) {
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
