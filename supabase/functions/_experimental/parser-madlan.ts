/**
 * Madlan Markdown Parser
 * 
 * Parses property listings from Madlan markdown.
 * Handles TWO distinct formats:
 * 
 * Format A - Broker listings (fragmented blocks):
 * [![Address, City](IMG_URL)](listing_url)
 * [![](AGENT_IMG)](agent_url)
 * ‏Price ‏₪
 * X חד׳
 * קומה Y
 * Z מ"ר
 * Type, Street, Neighborhood
 * תיווך
 * 
 * Format B - Private listings (compact block with \\):
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
 * Type, Street, Neighborhood](listing_url)
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
// Block Detection - Handles Format A & B
// ============================================

function findPropertyBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const lines = markdown.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for listing URL patterns
    const hasListingUrl = line.includes('madlan.co.il/listings/');
    
    if (!hasListingUrl) continue;
    
    // Format B: Compact block with \\ separators - entire listing in one line
    if (line.includes('\\\\') && line.match(/^\[!\[/)) {
      // Validate it has price (₪) to ensure it's a property listing
      if (line.includes('₪')) {
        blocks.push(line);
      }
      continue;
    }
    
    // Format A: Fragmented block - listing URL is at the start, details follow
    if (line.match(/^\[!\[[^\]]*\]\([^\)]+\)\]\(https:\/\/www\.madlan\.co\.il\/listings\//)) {
      // Collect the block - grab next 10-15 lines until we hit termination
      const blockLines: string[] = [line];
      
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const nextLine = lines[j];
        const nextLineTrimmed = nextLine.trim();
        
        // Stop if we hit a new property block
        if (nextLineTrimmed.startsWith('[![') && nextLineTrimmed.includes('/listings/')) {
          break;
        }
        
        // Stop at section headers
        if (nextLineTrimmed.startsWith('## ') || nextLineTrimmed.startsWith('# ')) {
          break;
        }
        
        blockLines.push(nextLine);
        
        // Stop after broker/exclusivity markers
        if (nextLineTrimmed === 'תיווך' || nextLineTrimmed === 'בבלעדיות') {
          break;
        }
      }
      
      const blockText = blockLines.join('\n');
      // Validate it has price
      if (blockText.includes('₪')) {
        blocks.push(blockText);
      }
      continue;
    }
  }
  
  return blocks;
}

// ============================================
// Block Parsing - Extract fields from either format
// ============================================

function parsePropertyBlock(block: string, propertyType: 'rent' | 'sale'): ParsedProperty | null {
  // Extract listing URL and ID
  const urlMatch = block.match(/https:\/\/www\.madlan\.co\.il\/listings\/([^\)\s\]]+)/);
  if (!urlMatch) return null;
  
  const sourceId = urlMatch[1].replace(/\)$/, ''); // Clean trailing )
  const sourceUrl = `https://www.madlan.co.il/listings/${sourceId}`;
  
  // Determine block format and split accordingly
  const isCompactBlock = block.includes('\\\\') && block.startsWith('[![');
  
  let parts: string[];
  if (isCompactBlock) {
    // Format B: Split by \\ 
    parts = block
      .split(/\\\\/)
      .map(p => p.trim())
      .filter(p => p.length > 0 && p !== '\\');
  } else {
    // Format A: Split by newlines
    parts = block
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }
  
  // Extract price
  const pricePart = parts.find(p => p.includes('₪'));
  const price = pricePart ? extractPrice(pricePart) : null;
  
  // Extract rooms - look for "X חד׳" pattern
  const roomsPart = parts.find(p => /\d+\.?\d*\s*חד[׳'ר]/.test(p));
  const rooms = roomsPart ? extractRooms(roomsPart) : null;
  
  // Extract floor - look for "קומה" pattern
  const floorPart = parts.find(p => /קומה/.test(p));
  const floor = floorPart ? extractFloor(floorPart) : null;
  
  // Extract size - look for מ"ר pattern
  const sizePart = parts.find(p => /\d+\s*מ"ר|\d+\s*מ״ר/.test(p));
  const size = sizePart ? extractSize(sizePart) : null;
  
  // Extract address and neighborhood from "Type, Street, Neighborhood" pattern
  let address: string | null = null;
  let neighborhood: string | null = null;
  let neighborhoodValue: string | null = null;
  const city = 'תל אביב יפו'; // Default for now, can be extracted from title
  
  // Look for property type patterns like "דירה, כתובת, שכונה"
  for (const part of parts) {
    // Match: "דירה, כתובת, שכונה" or "דירת גג, כתובת, שכונה" etc.
    const typePattern = /^(דירה|דירת גג|פנטהאוז|סטודיו|גן|קוטג'?|בית פרטי)/;
    if (typePattern.test(part)) {
      // Split by comma and extract
      const segments = part.split(',').map(s => s.trim());
      if (segments.length >= 2) {
        // Skip the type (first segment), street is usually second
        address = cleanText(segments[1]);
      }
      if (segments.length >= 3) {
        // Neighborhood is usually the last segment (remove trailing ] if present)
        const rawNeighborhood = cleanText(segments[segments.length - 1].replace(/\]$/, ''));
        const neighborhoodInfo = extractNeighborhood(rawNeighborhood, city);
        if (neighborhoodInfo) {
          neighborhood = neighborhoodInfo.label;
          neighborhoodValue = neighborhoodInfo.value;
        } else {
          neighborhood = rawNeighborhood;
        }
      }
      break;
    }
  }
  
  // Fallback: extract address from image alt text
  if (!address) {
    const altMatch = block.match(/\[!\[([^\]]+)\]/);
    if (altMatch) {
      const altText = altMatch[1];
      // Alt text is usually "Street, City"
      const altParts = altText.split(',').map(p => p.trim());
      if (altParts.length >= 1 && !altParts[0].includes('תל אביב')) {
        address = cleanText(altParts[0]);
      }
    }
  }
  
  // Skip if no useful data extracted
  if (!price && !rooms && !address) return null;
  
  // Detect broker - check for explicit markers OR agent image links
  const hasAgentImage = block.includes('[![](https://') && block.includes('/agents/');
  const hasBrokerKeyword = /תיווך|בבלעדיות|מתווך/.test(block);
  const isBroker = hasBrokerKeyword || hasAgentImage || detectBroker(block);
  
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
// Content Cleaning - Remove noise before parsing
// ============================================

function cleanMadlanContent(markdown: string): string {
  let cleaned = markdown;
  
  // 1. Skip navigation - find the listings header
  const headerPatterns = [
    /# דירות להשכרה/,
    /# דירות למכירה/,
    /דירות להשכרה בתל אביב/,
    /דירות למכירה בתל אביב/
  ];
  
  for (const pattern of headerPatterns) {
    const match = cleaned.search(pattern);
    if (match > 100) {
      cleaned = cleaned.substring(match);
      break;
    }
  }
  
  // 2. Remove blog section "יעניין אותך לדעת" - this appears mid-page
  const blogPatterns = [
    '## יעניין אותך לדעת',
    '## כתבות שיעניינו אותך',
    '### יעניין אותך'
  ];
  
  for (const blogStart of blogPatterns) {
    const blogIdx = cleaned.indexOf(blogStart);
    if (blogIdx > 0) {
      // Find where listings resume (next property block)
      const afterBlog = cleaned.substring(blogIdx);
      const nextListingMatch = afterBlog.search(/\n\[!\[[^\]]+\]\([^\)]+\)/);
      
      if (nextListingMatch > 0) {
        // Remove blog section, keep content before and after
        cleaned = cleaned.substring(0, blogIdx) + afterBlog.substring(nextListingMatch);
      } else {
        // Blog is at end, just remove it
        cleaned = cleaned.substring(0, blogIdx);
      }
      break;
    }
  }
  
  // 3. Remove footer sections
  const footerPatterns = [
    /\[דף הבית\]/,
    /## מידע חשוב/,
    /## דירות לפי/,
    /## חיפושים נפוצים/,
    /## שאלות נפוצות/
  ];
  
  for (const pattern of footerPatterns) {
    const match = cleaned.search(pattern);
    if (match > 0) {
      cleaned = cleaned.substring(0, match);
    }
  }
  
  return cleaned;
}
