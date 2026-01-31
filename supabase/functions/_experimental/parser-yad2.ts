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
// Main Entry Point
// ============================================

export function parseYad2Markdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
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
        properties.push(parsed);
      }
    } catch (error) {
      errors.push(`Block ${i}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log(`[parser-yad2] ✅ Parsed ${properties.length} properties (${properties.filter(p => p.is_private).length} private)`);
  
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

function findYad2Blocks(markdown: string): string[] {
  const blocks: string[] = [];
  
  // Pattern for Yad2 listing blocks - they start with "- [![" and contain /realestate/item/
  // Each block is a list item with the full property info
  const listItemPattern = /- \[!\[[^\]]*\]\([^\)]+\)\\[\s\S]*?\]\(https:\/\/www\.yad2\.co\.il\/realestate\/item\/[^\)]+\)/g;
  
  let match;
  while ((match = listItemPattern.exec(markdown)) !== null) {
    const block = match[0];
    
    // Skip blocks that look like project/yad1 links
    if (block.includes('/yad1/') || block.includes('/project/')) {
      continue;
    }
    
    // Must have price indicator
    if (block.includes('₪') || block.includes('חדרים')) {
      blocks.push(block);
    }
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
    .replace(/\\{2,}/g, '\\'); // Normalize backslashes
  
  // Extract price - look for ₪ followed by number
  const priceMatch = cleanedBlock.match(/₪\s*([\d,]+)/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : null;
  
  // Extract the bold section which contains main details
  // Format: **AddressType, Neighborhood, CityX חדרים • קומה Y • Z מ״ר**
  const boldMatch = cleanedBlock.match(/\*\*([^*]+)\*\*/);
  
  let rooms: number | null = null;
  let floor: number | null = null;
  let size: number | null = null;
  let address: string | null = null;
  let neighborhood: string | null = null;
  let neighborhoodValue: string | null = null;
  let city: string = 'תל אביב יפו';
  
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
    const neighborhoodInfo = extractNeighborhood(details, city);
    if (neighborhoodInfo) {
      neighborhood = neighborhoodInfo.label;
      neighborhoodValue = neighborhoodInfo.value;
    }
    
    // Extract address - first part before "דירה" or "דירת גן" etc.
    // Details format: "Address + Type, Neighborhood, CityX חדרים..."
    const addressPattern = /^([^,]+?)(?:דירה|דירת גן|גג\/פנטהאוז|סטודיו|פנטהאוז)/;
    const addressMatch = details.match(addressPattern);
    if (addressMatch) {
      address = cleanText(addressMatch[1]);
    } else {
      // Fallback: try to get address from image alt text
      const altMatch = block.match(/\[!\[([^\]]+)\]/);
      if (altMatch && !altMatch[1].includes('פרויקט')) {
        address = cleanText(altMatch[1]);
      }
    }
  }
  
  // ============================================
  // BROKER DETECTION - Yad2
  // Based on user screenshots:
  // - Broker: Shows "תיווך:" label + 7-digit license number
  // - Private: No such markers
  // ============================================
  
  // Check for explicit "תיווך" label (appears in broker listings)
  const hasTivuchLabel = /תיווך:?/.test(block);
  
  // Check for 7-digit license number (Israeli broker license)
  const hasLicenseNumber = /\d{7}/.test(block);
  
  // Check for "בבלעדיות" (exclusivity - broker indicator)
  const hasExclusivity = /בבלעדיות/.test(block);
  
  // Check for known broker brand names
  const BROKER_BRANDS = ['רימקס', 'אנגלו סכסון', 're/max', 'remax', 'century 21', 'קולדוול'];
  const blockLower = block.toLowerCase();
  const hasBrokerBrand = BROKER_BRANDS.some(brand => blockLower.includes(brand.toLowerCase()));
  
  // SIMPLE RULE: "תיווך" OR license number OR exclusivity OR known brand = broker
  // Otherwise = private
  const isBroker = hasTivuchLabel || hasLicenseNumber || hasExclusivity || hasBrokerBrand;
  
  // Extract features from the entire block
  const features = extractFeatures(block);
  
  // Skip if no meaningful data
  if (!price && !rooms && !address) {
    return null;
  }
  
  // Build title
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
    is_private: !isBroker,
    entry_date: null,
    features,
    raw_text: block.substring(0, 500)
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
