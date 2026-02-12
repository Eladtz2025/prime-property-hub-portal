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
  isBlacklistedLocation,
  type ParsedProperty,
  type ParserResult,
  type PropertyFeatures
} from './parser-utils.ts';
import { lookupNeighborhoodByStreet } from './street-lookup.ts';

/**
 * Parse Homeless HTML and extract property listings
 */
// NOTE: No default city fallback - we want NULL for unknown cities
// This prevents properties from other cities being mislabeled as Tel Aviv

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

      // 1) Prefer direct listing links
      const viewadLink = $row.find('a[href*="viewad"]').first();
      if (viewadLink.length) {
        sourceUrl = viewadLink.attr('href') || '';
      }

      // 2) Fallback: any homeless domain link in row
      if (!sourceUrl) {
        const domainLink = $row.find('a[href*="homeless.co.il"]').first();
        if (domainLink.length) {
          sourceUrl = domainLink.attr('href') || '';
        }
      }

      // 3) Fallback: first relative/absolute link
      if (!sourceUrl) {
        const anyLink = $row.find('a').first().attr('href') || '';
        if (anyLink.includes('homeless') || anyLink.startsWith('/')) {
          sourceUrl = anyLink;
        }
      }

      // Normalize relative links
      if (sourceUrl && sourceUrl.startsWith('/')) {
        sourceUrl = `https://www.homeless.co.il${sourceUrl}`;
      }

      // 4) If link still isn't a listing URL, extract ad id from row HTML
      if (!/viewad[,/]/i.test(sourceUrl)) {
        const rowHtml = $row.html() || '';
        const viewadMatch = rowHtml.match(/viewad[,/](\d+)/i);
        if (viewadMatch) {
          sourceUrl = `https://www.homeless.co.il/${propertyType === 'rent' ? 'rent' : 'sale'}/viewad,${viewadMatch[1]}.aspx`;
        }
      }

      // 5) Last fallback: build deterministic listing URL from row numeric id
      if (!sourceUrl && numericId) {
        sourceUrl = `https://www.homeless.co.il/${propertyType === 'rent' ? 'rent' : 'sale'}/viewad,${numericId}.aspx`;
      }
      
      // Normalize city - try column first, then pattern matching
      // NO FALLBACK - if we can't detect city, leave as null to avoid mislabeling
      const city = extractCity(cityText) || extractCity(neighborhoodText) || extractCity(fullRowText);
      
      // Extract neighborhood with city context - search in column sources only
      // FIXED: Do NOT search fullRowText - it contains "תל אביב יפו" which triggers false "יפו" matches
      let neighborhood = extractNeighborhood(neighborhoodText, city);
      if (!neighborhood && streetText) {
        neighborhood = extractNeighborhood(streetText, city);
      }
      // NOTE: Removed extractNeighborhood(fullRowText) fallback - causes false "יפו" matches from city name
      
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
      const title = buildTitle(propertyTypeText, roomsLabel, neighborhood?.label || neighborhoodText || '', streetText || null);
      
      // Parse entry date from full text
      const entryDate = parseHebrewDate(fullRowText);
      
      // ========== BLACKLIST CHECK: Skip non-Tel-Aviv properties ==========
      // Check title, address, and full row for blacklisted locations
      const textToCheck = `${streetText} ${neighborhoodText} ${cityText} ${title}`;
      const blacklistCheck = isBlacklistedLocation(textToCheck);
      if (blacklistCheck.blacklisted) {
        console.log(`[Homeless Parser] ⚠️ Blacklisted: ${streetText || neighborhoodText} → ${blacklistCheck.real_city}`);
        errors.push(`Row ${index}: Blacklisted location (${blacklistCheck.real_city})`);
        continue; // Skip this property entirely
      }
      
      // Skip rows with no city - this means it's from an unknown location
      // We don't want to import properties we can't properly categorize
      if (!city) {
        errors.push(`Row ${index}: No city detected, skipping (address: ${streetText || 'unknown'})`);
        continue;
      }
      
      // Skip rows with no meaningful data
      if (!price && !rooms) {
        errors.push(`Row ${index}: No meaningful data extracted`);
        continue;
      }
      
      // Extract features from full row text
      const features = extractFeatures(fullRowText);
      
      // ============================================
      // BROKER DETECTION - Homeless
      // Priority 1: URL pattern (highest reliability)
      // Priority 2: Text-based detection (SERP row keywords)
      // ============================================

      // PRIORITY 1: URL pattern (definitive)
      let urlBasedBroker: boolean | null = null;
      if (sourceUrl) {
        if (/(?:sale|rent)tivuch/i.test(sourceUrl)) {
          urlBasedBroker = true; // is broker
        } else if (/\/(sale|rent)\//i.test(sourceUrl)) {
          urlBasedBroker = false; // is private
        }
      }

      // PRIORITY 2: Text-based detection (existing logic)
      const hasAgencyName = /שם הסוכנות/.test(fullRowText);
      const hasAgencyField = /תיווך|סוכנות/.test(fullRowText);
      const hasLicenseNumber = /\d{7}/.test(fullRowText);
      const BROKER_BRANDS = ['רימקס', 'אנגלו סכסון', 're/max', 'remax', 'century 21', 'קולדוול'];
      const fullRowLower = fullRowText.toLowerCase();
      const hasBrokerBrand = BROKER_BRANDS.some(brand => 
        fullRowLower.includes(brand.toLowerCase())
      );
      const textBasedBroker = hasAgencyName || hasAgencyField || hasLicenseNumber || hasBrokerBrand;

      // URL overrides text (Tivuch URL = broker even if no text signals)
      const isBroker = urlBasedBroker !== null ? urlBasedBroker : textBasedBroker;

      const property: ParsedProperty = {
        source: 'homeless',
        source_id: generateSourceId('homeless', sourceUrl, index),
        source_url: sourceUrl,
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
  
  // Clean city names and "יפו" from location
  const INVALID_LOCATIONS = [
    'תל אביב יפו', 'תל אביב-יפו', 'תל אביב - יפו', 'תל אביב',
    'יפו' // Don't use standalone יפו as location fallback
  ];
  
  let cleanLocation = location.trim();
  
  // If location is just a city name, clear it
  if (INVALID_LOCATIONS.some(inv => cleanLocation === inv)) {
    cleanLocation = '';
  }
  
  // Remove city names if embedded in location string
  for (const cityName of ['תל אביב יפו', 'תל אביב-יפו', 'תל אביב']) {
    cleanLocation = cleanLocation.replace(cityName, '').trim();
  }
  cleanLocation = cleanLocation.replace(/^[,\-]\s*/, '').replace(/[,\-]\s*$/, '').trim();
  
  // Prevent street = location duplication
  const streetEqualsLocation = street && cleanLocation && 
    street.trim().toLowerCase() === cleanLocation.trim().toLowerCase();
  
  if (street && cleanLocation && !streetEqualsLocation) {
    parts.push(`ב${street}, ${cleanLocation}`);
  } else if (street) {
    parts.push(`ב${street}`);
  } else if (cleanLocation) {
    parts.push(`ב${cleanLocation}`);
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
