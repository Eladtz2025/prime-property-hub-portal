/**
 * Madlan Markdown Parser
 * 
 * Parses the SAME cleaned markdown that AI uses.
 * Format discovered from real Madlan pages:
 * 
 * [![כתובת, עיר](IMG_URL)\\
 * \\
 * חדש!\\
 * \\
 * ‏4,800 ‏₪\\
 * \\
 * 3 חד׳\\
 * \\
 * קומה 1\\
 * \\
 * 65 מ"ר\\
 * \\
 * דירה, אבי אסף 27, התקווה](https://www.madlan.co.il/listings/ID)
 */

import { 
  extractPrice, 
  extractRooms, 
  extractSize, 
  extractFloor,
  extractCity,
  extractNeighborhood,
  detectBroker,
  cleanText,
  type ParsedProperty,
  type ParserResult
} from './parser-utils.ts';

// ============================================
// Main Parser Entry Point
// ============================================

export function parseMadlanMarkdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  console.log(`[parser-madlan] Input: ${markdown.length} chars`);
  
  // 1. Clean the markdown (remove blog, navigation, etc.)
  const cleaned = cleanMadlanContent(markdown);
  console.log(`[parser-madlan] After cleaning: ${cleaned.length} chars`);
  
  // 2. Find property blocks - each is a complete markdown link with listing URL
  const blocks = findPropertyBlocks(cleaned);
  console.log(`[parser-madlan] Found ${blocks.length} property blocks`);
  
  // 3. Parse each block
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    try {
      const parsed = parsePropertyBlock(block, propertyType);
      if (parsed) {
        properties.push(parsed);
      }
    } catch (error) {
      errors.push(`Block ${i}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log(`[parser-madlan] ✅ Parsed ${properties.length} properties`);
  
  return {
    success: true,
    properties,
    stats: calculateStats(properties),
    errors
  };
}

// Legacy export for compatibility
export const parseMadlanHtml = parseMadlanMarkdown;

// ============================================
// Property Block Detection
// ============================================

/**
 * Find property blocks in Madlan markdown
 * Each property is a markdown link: [![...](img)\\...](listing_url)
 */
function findPropertyBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  
  // Pattern: [![alt](img_url)...](https://www.madlan.co.il/listings/ID)
  // The \\ separates lines within the link text
  const propertyPattern = /\[!\[[^\]]*\]\([^\)]*\)[^\]]*\]\(https:\/\/www\.madlan\.co\.il\/listings\/[^\)]+\)/g;
  
  let match;
  while ((match = propertyPattern.exec(markdown)) !== null) {
    blocks.push(match[0]);
  }
  
  // If no blocks found with image pattern, try simpler pattern
  if (blocks.length === 0) {
    console.log('[parser-madlan] No image blocks found, trying text-only pattern');
    
    // Pattern for text-only listings with price
    const textPattern = /\[[^\]]*‏?[\d,]+\s*‏?₪[^\]]*\]\(https:\/\/www\.madlan\.co\.il\/listings\/[^\)]+\)/g;
    
    while ((match = textPattern.exec(markdown)) !== null) {
      blocks.push(match[0]);
    }
  }
  
  return blocks;
}

// ============================================
// Property Block Parsing
// ============================================

function parsePropertyBlock(block: string, propertyType: 'rent' | 'sale'): ParsedProperty | null {
  // Split by \\ to get individual parts
  const parts = block.split(/\\\\/).map(p => p.trim()).filter(p => p.length > 0);
  
  // Extract URL and ID
  const urlMatch = block.match(/\(https:\/\/www\.madlan\.co\.il\/listings\/([^\)]+)\)/);
  if (!urlMatch) {
    return null;
  }
  
  const sourceId = urlMatch[1];
  const sourceUrl = `https://www.madlan.co.il/listings/${sourceId}`;
  
  // Find price (look for ₪)
  const pricePart = parts.find(p => p.includes('₪'));
  const price = pricePart ? extractPrice(pricePart) : null;
  
  // Find rooms (look for חד׳ or חדרים)
  const roomsPart = parts.find(p => /\d+\.?\d*\s*חד[׳'ר]/.test(p));
  const rooms = roomsPart ? extractRooms(roomsPart) : null;
  
  // Find floor (look for קומה)
  const floorPart = parts.find(p => /קומה/.test(p));
  const floor = floorPart ? extractFloor(floorPart) : null;
  
  // Find size (look for מ"ר or מ״ר)
  const sizePart = parts.find(p => /מ"ר|מ״ר|מ\"ר/.test(p));
  const size = sizePart ? extractSize(sizePart) : null;
  
  // Find address and neighborhood from the last meaningful part
  // Format: "דירה, רחוב 123, שכונה" or just "רחוב 123, שכונה"
  let address: string | null = null;
  let neighborhood: string | null = null;
  let neighborhoodValue: string | null = null;
  let city: string = 'תל אביב יפו';
  
  // Look for address pattern in parts (usually last part before URL)
  for (const part of parts) {
    // Pattern: "דירה, כתובת, שכונה" or "כתובת, שכונה"
    const addressMatch = part.match(/(?:דירה,\s*)?([^,\]]+\s*\d+)\s*,\s*([^,\]]+)/);
    if (addressMatch) {
      address = cleanText(addressMatch[1]);
      const rawNeighborhood = cleanText(addressMatch[2]);
      
      // Use extractNeighborhood to get normalized value
      const neighborhoodInfo = extractNeighborhood(rawNeighborhood, city);
      if (neighborhoodInfo) {
        neighborhood = neighborhoodInfo.label;
        neighborhoodValue = neighborhoodInfo.value;
      } else {
        neighborhood = rawNeighborhood;
      }
      break;
    }
  }
  
  // Also try to extract from first part (image alt text)
  if (!address) {
    const altMatch = block.match(/\[!\[([^\]]+)\]/);
    if (altMatch) {
      const altText = altMatch[1];
      const altAddressMatch = altText.match(/([^,]+\s*\d+)\s*,\s*([^,\]]+)/);
      if (altAddressMatch) {
        address = cleanText(altAddressMatch[1]);
        city = extractCity(altAddressMatch[2]) || city;
      }
    }
  }
  
  // Skip if we don't have minimal data
  if (!price && !rooms && !address) {
    return null;
  }
  
  // Detect broker
  const isBroker = detectBroker(block);
  
  // Build title
  const title = buildTitle(propertyType, rooms, neighborhood || city);
  
  return {
    source: 'madlan',
    source_id: `madlan_${sourceId}`,
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
    raw_text: block.substring(0, 500)
  };
}

// ============================================
// Content Cleaning
// ============================================

function cleanMadlanContent(markdown: string): string {
  let cleaned = markdown;
  const originalLength = cleaned.length;
  
  // 1. Find start of listings (skip navigation)
  const startPatterns = [
    /# דירות להשכרה ב/,
    /# דירות למכירה ב/,
    /## \d+ דירות/,
    /\[!\[.*\]\(https:\/\/images2\.madlan/,  // First property image
  ];
  
  for (const pattern of startPatterns) {
    const match = cleaned.search(pattern);
    if (match > 100) { // Only skip if there's significant content before
      cleaned = cleaned.substring(match);
      break;
    }
  }
  
  // 2. Remove blog section "יעניין אותך לדעת..."
  const blogPatterns = [
    /## יעניין אותך לדעת[^#]*/g,
    /### יעניין אותך לדעת[^#]*/g,
    /\*\*יעניין אותך לדעת\*\*[^[]*(?=\[)/g,
  ];
  
  for (const pattern of blogPatterns) {
    cleaned = cleaned.replace(pattern, '\n');
  }
  
  // 3. Remove footer
  const footerPatterns = [
    /\[דף הבית\].*/s,
    /## מידע חשוב.*/s,
    /## דירות לפי מספר חדרים.*/s,
  ];
  
  for (const pattern of footerPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // 4. Remove image URLs (but keep the structure)
  cleaned = cleaned.replace(/https:\/\/images2\.madlan\.co\.il\/[^\s\)\]]+/g, 'IMG');
  cleaned = cleaned.replace(/https:\/\/s3-eu-west-1\.amazonaws\.com\/media\.madlan\.co\.il\/[^\s\)\]]+/g, 'IMG');
  
  console.log(`[parser-madlan] Cleaned: ${originalLength} → ${cleaned.length} chars (${Math.round((1 - cleaned.length/originalLength) * 100)}% reduction)`);
  
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
