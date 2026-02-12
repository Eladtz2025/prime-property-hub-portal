/**
 * Yad2 Property Parser - V2
 * 
 * Parses property listings from Yad2 Markdown content.
 * Handles the actual Yad2 format:
 * 
 * Format A - Broker listing:
 * - [![Address](IMG)\\
 * \\
 * Agency Name\\
 * \\
 * Agency Name₪ Price\\
 * \\
 * **Address Type, Neighborhood, CityX חדרים • קומה ‎Y‏ • Z מ״ר**](url)
 * 
 * Format B - Private listing:
 * - [![Address](IMG)\\
 * \\
 * ₪ Price\\
 * \\
 * **Address Type, Neighborhood, CityX חדרים • קומה ‎Y‏ • Z מ״ר**\\
 * \\
 * tags](url)
 */

import { 
  extractPrice, 
  extractRooms, 
  extractSize, 
  extractFloor,
  extractCity,
  extractNeighborhood,
  extractFeatures,
  mergeFeatures,
  detectBroker,
  cleanText,
  generateSourceId,
  type ParsedProperty,
  type ParserResult,
  type PropertyFeatures
} from './parser-utils.ts';

// ============================================
// Address Validation
// ============================================

// Patterns that indicate an invalid address (broker names, property types, etc.)
const INVALID_ADDRESS_PATTERNS = [
  /^גג\/?$/i,                    // "גג/" - property type
  /^דירה$/i,                     // "דירה" - property type  
  /^סטודיו$/i,                   // "סטודיו" - property type
  /^פנטהאוז$/i,                  // "פנטהאוז" - property type
  /נדל"?ן/i,                     // Real estate office name
  /^RS\s/i,                      // RS broker prefix
  /רימקס|re\/?max/i,             // RE/MAX broker
  /אנגלו\s*סכסון/i,              // Anglo Saxon broker
  /century\s*21/i,               // Century 21 broker
  /קולדוול/i,                    // Coldwell broker
  /הומלנד/i,                     // Homeland broker
  /Properties/i,                 // Properties broker
  /HomeMe/i,                     // HomeMe broker
  /Premium/i,                    // Premium broker
  /בית\s*ממכר/i,                 // Brokerage name
  /ניהול\s*נכסים/i,              // Property management
  /משרד\s*תיווך/i,               // Brokerage office
  /סוכנות/i,                     // Agency
  /Relocation/i,                 // Relocation broker
  /REAL\s*ESTATE/i,              // Real estate broker
  /FRANCHI/i,                    // Franchi broker
  /^הצפון\s*(ה)?(חדש|ישן)/i,     // Neighborhood names, not addresses
  /^צפון$/i,                     // Just "north", not address
  /^מרכז$/i,                     // Just "center", not address
];

function isValidAddress(address: string): boolean {
  if (!address || address.length < 3) return false;
  // Check if address matches any invalid pattern
  if (INVALID_ADDRESS_PATTERNS.some(p => p.test(address))) return false;
  // Address should contain at least one Hebrew letter
  if (!/[\u0590-\u05FF]/.test(address)) return false;
  // Address should not be identical to neighborhood name patterns
  if (/^הצפון|^צפון\s*(ישן|חדש)|^רמת\s*אביב$|^פלורנטין$|^נווה\s*צדק$/i.test(address)) return false;
  return true;
}

// ============================================
// Main Entry Point
// ============================================

export function parseYad2Markdown(
  markdown: string,
  propertyType: 'rent' | 'sale',
  ownerTypeFilter?: 'private' | 'broker' | null
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  console.log(`[parser-yad2] Input: ${markdown.length} chars`);
  
  // 1. Clean markdown (skip navigation)
  const cleaned = cleanYad2Content(markdown);
  console.log(`[parser-yad2] After cleaning: ${cleaned.length} chars`);
  
  // 2. Find property blocks
  const blocks = findYad2Blocks(cleaned);
  console.log(`[parser-yad2] Found ${blocks.length} property blocks`);
  
  // 3. Parse each block
  for (let i = 0; i < blocks.length; i++) {
    try {
      const parsed = parseYad2Block(blocks[i], propertyType, i);
      if (parsed) {
        // Filter by owner type at the earliest stage
        if (ownerTypeFilter === 'private' && parsed.is_private !== true) continue;
        if (ownerTypeFilter === 'broker' && parsed.is_private !== false) continue;
        properties.push(parsed);
      }
    } catch (error) {
      errors.push(`Block ${i}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  const stats = calculateStats(properties);
  console.log(`[parser-yad2] ✅ Parsed ${properties.length} properties (${stats.private_count} private, ${stats.broker_count} broker, ${stats.unknown_count} unknown)`);
  
  return {
    success: true,
    properties,
    stats: calculateStats(properties),
    errors
  };
}

// Keep HTML parser alias for compatibility
export async function parseYad2Html(
  html: string, 
  propertyType: 'rent' | 'sale',
  useStreetLookup: boolean = true,
  url?: string
): Promise<ParserResult> {
  // Just use the markdown parser - HTML isn't used anymore
  return parseYad2Markdown(html, propertyType);
}

// ============================================
// Block Detection
// ============================================

/**
 * Check if a block is a valid property listing
 */
function isValidPropertyBlock(block: string): boolean {
  // Must contain a Yad2 realestate/item URL
  if (!block.includes('yad2.co.il/realestate/item/')) {
    return false;
  }
  
  // Skip invalid URL patterns (projects, search pages, yad1)
  if (
    block.includes('/yad1/') || 
    block.includes('/project/') ||
    block.includes('forsale?') ||
    block.includes('forrent?') ||
    block.includes('/yad1/project/')
  ) {
    return false;
  }
  
  // Must have price indicator or rooms
  if (!block.includes('₪') && !block.includes('חדרים')) {
    return false;
  }
  
  return true;
}

function findYad2Blocks(markdown: string): string[] {
  const blocks: string[] = [];
  
  // Split by newlines (NOT spaces!) and accumulate list items
  const lines = markdown.split('\n');
  let currentBlock = '';
  let inBlock = false;
  
  for (const line of lines) {
    // New list item starts a new block (line starts with "- ")
    if (line.startsWith('- ')) {
      // Save previous block if valid
      if (currentBlock && isValidPropertyBlock(currentBlock)) {
        blocks.push(currentBlock.trim());
      }
      currentBlock = line;
      inBlock = true;
    } else if (inBlock) {
      // Continue current block - append line
      currentBlock += '\n' + line;
    }
  }
  
  // Don't forget the last block
  if (currentBlock && isValidPropertyBlock(currentBlock)) {
    blocks.push(currentBlock.trim());
  }
  
  return blocks;
}

// ============================================
// Block Parsing
// ============================================

function parseYad2Block(block: string, propertyType: 'rent' | 'sale', index: number): ParsedProperty | null {
  // Extract URL
  const urlMatch = block.match(/https:\/\/www\.yad2\.co\.il\/realestate\/item\/([^\?\)]+)/);
  if (!urlMatch) return null;
  
  const sourceId = urlMatch[1];
  const sourceUrl = `https://www.yad2.co.il/realestate/item/${sourceId}`;
  
  // Remove RTL markers for easier parsing
  const cleanedBlock = block
    .replace(/[\u200F\u200E‎‏]/g, '') // RTL/LTR markers
    .replace(/\\{2,}/g, ' '); // Normalize backslashes to spaces
  
  // Extract price - look for ₪ followed by number
  const priceMatch = cleanedBlock.match(/₪\s*([\d,]+)/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : null;
  
  // ============================================
  // Structural broker detection from SERP block
  // ============================================
  // In Yad2 SERP, broker listings have agency name between image and ₪:
  //   [![Address](IMG)\\ \\ AgencyName\\ \\ AgencyName₪ Price
  // Private listings go directly from image to ₪:
  //   [![Address](IMG)\\ \\ ₪ Price
  
  let isPrivate: boolean | null = null;
  let detectedAgency: string | null = null;
  
  // Simple rule: text between image and ₪ = broker, no text = private
  const imgEndMatch = block.match(/\]\([^)]+\)/);
  // Find the ACTUAL price ₪ (₪ followed by number), not price-drop tags (number followed by ₪)
  const priceLineMatch = block.match(/₪\s*[\d,]/);
  const shekelIndex = priceLineMatch ? block.indexOf(priceLineMatch[0]) : -1;
  
  if (imgEndMatch && shekelIndex > 0) {
    const imgEndPos = block.indexOf(imgEndMatch[0]) + imgEndMatch[0].length;
    if (shekelIndex > imgEndPos) {
      const textBetween = block.substring(imgEndPos, shekelIndex)
        .replace(/[\u200F\u200E\u200B‎‏]/g, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')  // Strip markdown images
        .replace(/ירד ב-?[\d,]+\s*₪/g, '')    // Strip price-drop tags
        .replace(/בלעדי/g, '')                  // Strip "exclusive" tag
        .replace(/חדש מקבלן/g, '')              // Strip "new from builder" tag
        .replace(/\\/g, '')
        .replace(/\n/g, ' ')
        .trim();
      
      // Get alt text to exclude from comparison
      const altMatch = block.match(/\[!\[([^\]]*)\]/);
      const altText = altMatch ? altMatch[1].trim() : '';
      
      if (textBetween.length > 2 && textBetween !== altText) {
        // Text above price = broker
        isPrivate = false;
        detectedAgency = textBetween;
        console.log(`[Yad2] Broker detected: "${textBetween.substring(0, 50)}"`);
      } else {
        // No text above price = private
        isPrivate = true;
      }
    }
  }
  
  // ============================================
  // Extract property details
  // ============================================
  const boldMatch = cleanedBlock.match(/\*\*([^*]+)\*\*/);
  
  let rooms: number | null = null;
  let floor: number | null = null;
  let size: number | null = null;
  let address: string | null = null;
  let neighborhood: string | null = null;
  let neighborhoodValue: string | null = null;
  let city: string | null = null; // No default - extract from content
  
  if (boldMatch) {
    const details = boldMatch[1];
    
    // Extract rooms: "X חדרים" or "X.5 חדרים"
    const roomsMatch = details.match(/(\d+(?:\.\d)?)\s*חדרים/);
    if (roomsMatch) {
      rooms = parseFloat(roomsMatch[1]);
    }
    
    // Extract floor: "קומה Y" (Y can include ‎ markers)
    const floorMatch = details.match(/קומה\s*(\d+|קרקע)/);
    if (floorMatch) {
      floor = floorMatch[1] === 'קרקע' ? 0 : parseInt(floorMatch[1], 10);
    }
    
    // Extract size: "Z מ״ר" or "Z מ"ר"
    const sizeMatch = details.match(/(\d+)\s*מ[״"']?ר/);
    if (sizeMatch) {
      size = parseInt(sizeMatch[1], 10);
    }
    
    // Extract city from details
    const extractedCity = extractCity(details);
    if (extractedCity) {
      city = extractedCity;
    }
    
    // Extract neighborhood
    const neighborhoodInfo = extractNeighborhood(details, city || '');
    if (neighborhoodInfo) {
      neighborhood = neighborhoodInfo.label;
      neighborhoodValue = neighborhoodInfo.value;
    }
    
    // Extract address - first part before "דירה" or "דירת גן" etc.
    const addressPattern = /^([^,]+?)(?:דירה|דירת גן|גג\/פנטהאוז|סטודיו|פנטהאוז)/;
    const addressMatch = details.match(addressPattern);
    let boldAddress: string | null = null;
    if (addressMatch) {
      boldAddress = cleanText(addressMatch[1]);
    }
    
    // Also check alt text for address (may contain house number)
    let altAddress: string | null = null;
    const altMatch = block.match(/\[!\[([^\]]+)\]/);
    if (altMatch && !altMatch[1].includes('פרויקט')) {
      altAddress = cleanText(altMatch[1]);
    }
    
    // Prefer address WITH house number over one without
    const boldHasNum = boldAddress && /\d{1,3}/.test(boldAddress);
    const altHasNum = altAddress && /\d{1,3}/.test(altAddress);
    
    if (boldHasNum) {
      address = boldAddress;
    } else if (altHasNum) {
      address = altAddress;
    } else {
      address = boldAddress || altAddress;
    }
  }
  
  // Extract features from the entire block
  const features = extractFeatures(block);
  
  // Validate address - filter out broker names and invalid values
  if (address && !isValidAddress(address)) {
    address = null;
  }
  
  // Skip if no meaningful data
  if (!price && !rooms && !address) {
    return null;
  }
  
  // Build title (handle null city/neighborhood)
  const title = buildTitle(propertyType, rooms, neighborhood || city);
  
  return {
    source: 'yad2',
    source_id: `yad2_${sourceId}`,
    source_url: sourceUrl,
    title,
    city,
    neighborhood,
    neighborhood_value: neighborhoodValue,
    address,
    price,
    rooms,
    size,
    floor,
    property_type: propertyType,
    is_private: isPrivate,
    entry_date: null,
    features,
    raw_text: block.substring(0, 500),
    raw_data: {
      detected_agency: detectedAgency,
      serp_block: block.substring(0, 800)
    }
  };
}

// ============================================
// Content Cleaning
// ============================================

function cleanYad2Content(markdown: string): string {
  let cleaned = markdown;
  
  // 1. Skip navigation - find the results header
  const headerPatterns = [
    /# דירות להשכרה/,
    /# דירות למכירה/,
    /\d+,?\d*\s*תוצאות/,
    /מיון לפי תאריך/
  ];
  
  for (const pattern of headerPatterns) {
    const match = cleaned.search(pattern);
    if (match > 100) {
      cleaned = cleaned.substring(match);
      console.log(`[Yad2 Clean] Skipped ${match} chars of navigation`);
      break;
    }
  }
  
  // 2. Remove yad1/project sections
  const yad1Patterns = [
    /## פרויקטים חדשים באזור[\s\S]*?למה כדאי לקנות נכסים יד1/,
    /## פרויקטים חדשים\n[\s\S]*?\[לכל הפרויקטים\]/
  ];
  
  for (const pattern of yad1Patterns) {
    cleaned = cleaned.replace(pattern, '\n');
  }
  
  // 3. Remove footer
  const footerPatterns = [
    /## כתבות שיעניינו/,
    /## שאלות נפוצות/,
    /## חיפושים פופולריים/
  ];
  
  for (const pattern of footerPatterns) {
    const match = cleaned.search(pattern);
    if (match > 0) {
      cleaned = cleaned.substring(0, match);
    }
  }
  
  return cleaned;
}

// ============================================
// Helper Functions
// ============================================

function buildTitle(propertyType: string, rooms: number | null, location: string | null): string {
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
    // Fix: explicit checks to avoid null being counted as broker
    private_count: properties.filter(p => p.is_private === true).length,
    broker_count: properties.filter(p => p.is_private === false).length,
    unknown_count: properties.filter(p => p.is_private === null).length,
  };
}

// ============================================
// URL City Extraction (for HTML parser compatibility)
// ============================================

export function extractCityFromUrl(url: string): string | null {
  const CITY_CODES: Record<string, string> = {
    '5000': 'תל אביב יפו',
    '8600': 'רמת גן',
    '6400': 'גבעתיים',
    '6900': 'הרצליה',
    '8700': 'רעננה',
    '7900': 'פתח תקווה',
    '8300': 'ראשון לציון',
    '6600': 'חולון',
    '6200': 'בת ים',
    '7400': 'נתניה',
    '6100': 'בני ברק',
    '6800': 'כפר סבא',
    '6700': 'הוד השרון',
    '8500': 'רמת השרון',
    '70': 'אשדוד',
    '7100': 'אשקלון',
    '3000': 'ירושלים',
    '4000': 'חיפה',
    '7500': 'באר שבע',
  };
  
  try {
    const urlObj = new URL(url);
    const cityCode = urlObj.searchParams.get('city');
    if (cityCode && CITY_CODES[cityCode]) {
      return CITY_CODES[cityCode];
    }
  } catch {
    const cityMatch = url.match(/city=(\d+)/);
    if (cityMatch && CITY_CODES[cityMatch[1]]) {
      return CITY_CODES[cityMatch[1]];
    }
  }
  
  return null;
}
