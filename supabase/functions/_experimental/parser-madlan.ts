/**
 * Madlan Markdown Parser
 * 
 * Simple, focused parser that works on the SAME cleaned markdown that AI uses.
 * No JSON extraction, no cheerio - just robust regex patterns.
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
  generateSourceId,
  type ParsedProperty,
  type ParserResult
} from './parser-utils.ts';

// ============================================
// Main Parser Entry Point
// ============================================

/**
 * Parse Madlan property listings from Markdown content
 * This is the ONLY parser - same input as AI receives
 */
export function parseMadlanMarkdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  // 1. Clean the markdown (same cleaning as AI preprocessing)
  const cleaned = cleanMadlanContent(markdown);
  
  console.log(`[parser-madlan] Input: ${markdown.length} chars → Cleaned: ${cleaned.length} chars`);
  
  // 2. Find property blocks and extract data
  const blocks = findPropertyBlocks(cleaned);
  console.log(`[parser-madlan] Found ${blocks.length} property blocks`);
  
  // 3. Parse each block
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    try {
      const price = extractPrice(block);
      const rooms = extractRooms(block);
      const size = extractSize(block);
      const floor = extractFloor(block);
      const address = extractAddress(block);
      const city = extractCity(block) || 'תל אביב יפו';
      const neighborhood = extractNeighborhood(block, city);
      const isBroker = detectBroker(block);
      
      // Skip blocks without meaningful data
      if (!price && !rooms && !address) {
        continue;
      }
      
      const title = buildTitle(propertyType, rooms, neighborhood?.label || city);
      
      properties.push({
        source: 'madlan',
        source_id: generateSourceId('madlan', block, i),
        source_url: extractSourceUrl(block),
        title,
        city,
        neighborhood: neighborhood?.label || null,
        neighborhood_value: neighborhood?.value || null,
        address: address,
        price,
        rooms,
        size,
        floor,
        property_type: propertyType,
        is_private: !isBroker,
        entry_date: null,
        raw_text: block.substring(0, 500)
      });
      
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
// Content Cleaning (mirrors AI preprocessing)
// ============================================

function cleanMadlanContent(markdown: string): string {
  let cleaned = markdown;
  const originalLength = cleaned.length;
  
  // 1. Skip navigation - start from listings header
  const headerPatterns = [
    /# דירות להשכרה ב/,
    /# דירות למכירה ב/,
    /## \d+ דירות/,
    /₪.*חד[׳']/,
  ];
  
  for (const pattern of headerPatterns) {
    const match = cleaned.search(pattern);
    if (match > 0) {
      cleaned = cleaned.substring(match);
      break;
    }
  }
  
  // 2. Remove blog section "יעניין אותך לדעת..."
  const blogStart = cleaned.indexOf('## יעניין אותך לדעת');
  if (blogStart > 0) {
    const afterBlog = cleaned.substring(blogStart);
    const nextPropertyMatch = afterBlog.match(/\[‏[\d,]+\s*‏₪/);
    if (nextPropertyMatch?.index) {
      cleaned = cleaned.substring(0, blogStart) + afterBlog.substring(nextPropertyMatch.index);
    } else {
      cleaned = cleaned.substring(0, blogStart);
    }
  }
  
  // 3. Remove footer
  const footerPatterns = [/\[דף הבית\]/, /מידע חשוב/, /דירות לפי מספר חדרים/];
  for (const pattern of footerPatterns) {
    const footerStart = cleaned.search(pattern);
    if (footerStart > 0) {
      cleaned = cleaned.substring(0, footerStart);
      break;
    }
  }
  
  // 4. Remove image URLs (saves ~40% of content)
  cleaned = cleaned.replace(/https:\/\/images2\.madlan\.co\.il\/[^\s\)\]]+/g, '[IMG]');
  cleaned = cleaned.replace(/https:\/\/s3-eu-west-1\.amazonaws\.com\/media\.madlan\.co\.il\/[^\s\)\]]+/g, '[IMG]');
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^\)]*\)/g, '[IMG]');
  
  console.log(`[parser-madlan] Cleaned: ${originalLength} → ${cleaned.length} chars (${Math.round((1 - cleaned.length/originalLength) * 100)}% reduction)`);
  
  return cleaned;
}

// ============================================
// Property Block Detection
// ============================================

/**
 * Find individual property blocks in the markdown
 * Each block starts with a price pattern
 */
function findPropertyBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  
  // Price patterns that start a new property block
  // Format: [‏4,800‏₪] or ₪4,800 or 4,800₪
  const priceStartPattern = /[\[‏]*[\d,]+[‏\s]*₪|₪[‏\s]*[\d,]+/g;
  
  const lines = markdown.split('\n');
  let currentBlock = '';
  let linesSincePrice = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if this line starts a new property (has price)
    if (priceStartPattern.test(trimmed)) {
      // Save previous block if it has content
      if (currentBlock.length > 20) {
        blocks.push(currentBlock.trim());
      }
      // Start new block
      currentBlock = trimmed + '\n';
      linesSincePrice = 0;
      priceStartPattern.lastIndex = 0; // Reset regex
    } else if (currentBlock) {
      // Add to current block (max 10 lines per property)
      if (linesSincePrice < 10) {
        currentBlock += trimmed + '\n';
        linesSincePrice++;
      }
    }
  }
  
  // Don't forget last block
  if (currentBlock.length > 20) {
    blocks.push(currentBlock.trim());
  }
  
  return blocks;
}

// ============================================
// Field Extraction
// ============================================

/**
 * Extract address from markdown block
 * Patterns: **כתובת**, [כתובת], bold text with street number
 */
function extractAddress(text: string): string | null {
  // Pattern 1: Bold address **אבי אסף 27**
  const boldMatch = text.match(/\*\*([^*]+\d+[^*]*)\*\*/);
  if (boldMatch) {
    return cleanText(boldMatch[1]);
  }
  
  // Pattern 2: Address with comma before neighborhood
  const commaMatch = text.match(/\*\*([^*,]+)\*\*\s*,/);
  if (commaMatch) {
    return cleanText(commaMatch[1]);
  }
  
  // Pattern 3: Any bold text that looks like address (has Hebrew + number)
  const anyBold = text.match(/\*\*([^*]+)\*\*/);
  if (anyBold && /[\u0590-\u05FF]/.test(anyBold[1]) && /\d/.test(anyBold[1])) {
    return cleanText(anyBold[1]);
  }
  
  // Pattern 4: Street name followed by number
  const streetMatch = text.match(/(רחוב\s+[^\d,]+\s*\d+|[א-ת]+\s+\d+)/);
  if (streetMatch) {
    return cleanText(streetMatch[1]);
  }
  
  return null;
}

/**
 * Extract source URL from markdown links
 */
function extractSourceUrl(text: string): string {
  // Pattern: [text](https://www.madlan.co.il/...)
  const urlMatch = text.match(/\(https:\/\/www\.madlan\.co\.il\/[^)]+\)/);
  if (urlMatch) {
    return urlMatch[0].slice(1, -1); // Remove parentheses
  }
  
  // Pattern: /listings/ID or /nadlan/ID
  const idMatch = text.match(/\/(?:listings|nadlan)\/([a-zA-Z0-9-]+)/);
  if (idMatch) {
    return `https://www.madlan.co.il/listings/${idMatch[1]}`;
  }
  
  return '';
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
