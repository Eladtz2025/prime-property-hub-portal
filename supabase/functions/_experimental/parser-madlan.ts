/**
 * Madlan Markdown Parser
 * 
 * Parses property listings from Madlan markdown.
 * Format: Each property is a markdown link containing image + details separated by \\
 * 
 * Example:
 * [![Address, City](IMG_URL)\\
 * \\
 * ‏Price ‏₪\\
 * \\
 * X חד׳\\
 * \\
 * קומה Y\\
 * \\
 * Z מ"ר\\
 * \\
 * Type, Street, Neighborhood](https://www.madlan.co.il/listings/ID)
 */

import { 
  extractPrice, 
  extractRooms, 
  extractSize, 
  extractFloor,
  extractNeighborhood,
  detectBroker,
  cleanText,
  type ParsedProperty,
  type ParserResult
} from './parser-utils.ts';

// ============================================
// Main Entry Point
// ============================================

export function parseMadlanMarkdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  console.log(`[parser-madlan] Input: ${markdown.length} chars`);
  
  // 1. Clean markdown (remove nav, blog, footer)
  const cleaned = cleanMadlanContent(markdown);
  console.log(`[parser-madlan] After cleaning: ${cleaned.length} chars`);
  
  // 2. Find property blocks
  const blocks = findPropertyBlocks(cleaned);
  console.log(`[parser-madlan] Found ${blocks.length} property blocks`);
  
  // 3. Parse each block
  for (let i = 0; i < blocks.length; i++) {
    try {
      const parsed = parsePropertyBlock(blocks[i], propertyType);
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
    stats: {
      total_found: properties.length,
      with_price: properties.filter(p => p.price !== null).length,
      with_rooms: properties.filter(p => p.rooms !== null).length,
      with_address: properties.filter(p => p.address !== null).length,
      with_size: properties.filter(p => p.size !== null).length,
      with_floor: properties.filter(p => p.floor !== null).length,
      private_count: properties.filter(p => p.is_private).length,
      broker_count: properties.filter(p => !p.is_private).length,
    },
    errors
  };
}

export const parseMadlanHtml = parseMadlanMarkdown;

// ============================================
// Block Detection
// ============================================

function findPropertyBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  
  // Split by lines and find blocks that start with [![ and end with ](listing_url)
  const lines = markdown.split('\n');
  let currentBlock: string[] = [];
  let inBlock = false;
  
  for (const line of lines) {
    // Start of a new block: [![...](...)]
    if (line.match(/^\[!\[/)) {
      // Save previous block if exists
      if (inBlock && currentBlock.length > 0) {
        const blockText = currentBlock.join('\n');
        if (blockText.includes('₪') && blockText.includes('madlan.co.il/listings/')) {
          blocks.push(blockText);
        }
      }
      currentBlock = [line];
      inBlock = true;
      
      // Check if single-line complete block
      if (line.includes('](https://www.madlan.co.il/listings/')) {
        blocks.push(line);
        inBlock = false;
        currentBlock = [];
      }
      continue;
    }
    
    // End of block: contains the listing URL
    if (inBlock && line.includes('](https://www.madlan.co.il/listings/')) {
      currentBlock.push(line);
      const blockText = currentBlock.join('\n');
      if (blockText.includes('₪')) {
        blocks.push(blockText);
      }
      inBlock = false;
      currentBlock = [];
      continue;
    }
    
    // Continue building block
    if (inBlock) {
      currentBlock.push(line);
    }
  }
  
  return blocks;
}

// ============================================
// Block Parsing
// ============================================

function parsePropertyBlock(block: string, propertyType: 'rent' | 'sale'): ParsedProperty | null {
  // Extract listing URL and ID
  const urlMatch = block.match(/https:\/\/www\.madlan\.co\.il\/listings\/([^\)\s\]]+)/);
  if (!urlMatch) return null;
  
  const sourceId = urlMatch[1];
  const sourceUrl = `https://www.madlan.co.il/listings/${sourceId}`;
  
  // Split block into parts (by \\ or newlines)
  const parts = block
    .replace(/\\\\/g, '\n')
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0 && p !== '\\');
  
  // Extract fields
  const pricePart = parts.find(p => p.includes('₪'));
  const price = pricePart ? extractPrice(pricePart) : null;
  
  const roomsPart = parts.find(p => /\d+\.?\d*\s*חד[׳'ר]/.test(p));
  const rooms = roomsPart ? extractRooms(roomsPart) : null;
  
  const floorPart = parts.find(p => /קומה\s*\d/.test(p));
  const floor = floorPart ? extractFloor(floorPart) : null;
  
  const sizePart = parts.find(p => /\d+\s*מ"ר|\d+\s*מ״ר/.test(p));
  const size = sizePart ? extractSize(sizePart) : null;
  
  // Extract address and neighborhood
  let address: string | null = null;
  let neighborhood: string | null = null;
  let neighborhoodValue: string | null = null;
  const city = 'תל אביב יפו';
  
  // Look for "דירה, כתובת, שכונה" pattern
  for (const part of parts) {
    const addrMatch = part.match(/(?:דירה|דירת גג|פנטהאוז|סטודיו),?\s*([^,\]]+)\s*,\s*([^,\]\)]+)/);
    if (addrMatch) {
      address = cleanText(addrMatch[1]);
      const rawNeighborhood = cleanText(addrMatch[2]);
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
  
  // Fallback: extract from image alt text
  if (!address) {
    const altMatch = block.match(/\[!\[([^\]]+)\]/);
    if (altMatch) {
      const altParts = altMatch[1].split(',').map(p => p.trim());
      if (altParts.length >= 1) {
        address = cleanText(altParts[0]);
      }
    }
  }
  
  // Skip if no useful data
  if (!price && !rooms && !address) return null;
  
  // Detect broker
  const isBroker = detectBroker(block);
  
  // Build title
  const roomsLabel = rooms ? `${rooms} חדרים` : '';
  const typeLabel = propertyType === 'rent' ? 'להשכרה' : 'למכירה';
  const location = neighborhood || city;
  const title = roomsLabel 
    ? `דירה ${roomsLabel} ${typeLabel} ב${location}`
    : `דירה ${typeLabel} ב${location}`;
  
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
  
  // 1. Skip navigation - find first property listing header or image
  const startMatch = cleaned.search(/# דירות להשכרה|# דירות למכירה|\[!\[.*?\]\(https:\/\/images/);
  if (startMatch > 100) {
    cleaned = cleaned.substring(startMatch);
  }
  
  // 2. Remove blog section "יעניין אותך לדעת" 
  // This section appears between listings - remove it entirely
  const blogStart = cleaned.indexOf('## יעניין אותך לדעת');
  if (blogStart > 0) {
    // Find where listings resume (next [![)
    const afterBlog = cleaned.substring(blogStart);
    const nextListing = afterBlog.search(/\[!\[/);
    if (nextListing > 0) {
      cleaned = cleaned.substring(0, blogStart) + cleaned.substring(blogStart + nextListing);
    }
  }
  
  // 3. Remove footer
  const footerPatterns = [
    /\[דף הבית\]/,
    /## מידע חשוב/,
    /## דירות לפי/,
  ];
  
  for (const pattern of footerPatterns) {
    const match = cleaned.search(pattern);
    if (match > 0) {
      cleaned = cleaned.substring(0, match);
    }
  }
  
  return cleaned;
}
