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
  extractFeatures,
  mergeFeatures,
  detectBroker,
  cleanText,
  type ParsedProperty,
  type ParserResult,
  type PropertyFeatures
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
    const line = lines[i].trim();
    
    // Look for listing OR project URL patterns
    const hasListingUrl = line.includes('madlan.co.il/listings/') || line.includes('madlan.co.il/projects/');
    
    if (!hasListingUrl) continue;
    
    // Skip if this is a duplicate (same URL already captured)
    const urlMatch = line.match(/https:\/\/www\.madlan\.co\.il\/(listings|projects)\/([^\)\s\]]+)/);
    if (urlMatch) {
      const urlId = urlMatch[2];
      if (blocks.some(b => b.includes(urlId))) continue;
    }
    
    // Format B: Compact block with \\ separators - entire listing in one line
    if (line.includes('\\\\') || line.includes('\\\n')) {
      // Accept blocks with price OR rooms OR size OR project keywords
      if (line.includes('₪') || /\d+\s*חד[׳'ר]/.test(line) || /\d+\s*מ"ר/.test(line) || /קומות/.test(line)) {
        blocks.push(line);
      }
      continue;
    }
    
    // Format A: Fragmented block - listing URL is in line with image, details follow
    if (line.match(/^\[!\[[^\]]*\]\([^\)]+\)\]\(https:\/\/www\.madlan\.co\.il\/(listings|projects)\//)) {
      // Collect the block - grab next 10-15 lines until we hit termination
      const blockLines: string[] = [line];
      
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const nextLine = lines[j];
        const nextLineTrimmed = nextLine.trim();
        
        // Stop if we hit a new property block (listing or project)
        if (nextLineTrimmed.startsWith('[![') && (nextLineTrimmed.includes('/listings/') || nextLineTrimmed.includes('/projects/'))) {
          break;
        }
        
        // Stop at section headers
        if (nextLineTrimmed.startsWith('## ') || nextLineTrimmed.startsWith('# ')) {
          break;
        }
        
        // Stop at agent badge/premium blocks
        if (nextLineTrimmed.includes('משרד מוביל') || nextLineTrimmed.includes('צרו קשר עם המשרד')) {
          break;
        }
        
        blockLines.push(nextLine);
        
        // Stop after broker/exclusivity markers
        if (nextLineTrimmed === 'תיווך' || nextLineTrimmed === 'בבלעדיות') {
          break;
        }
      }
      
      const blockText = blockLines.join('\n');
      // Accept blocks with price OR rooms OR size OR project indicators (relaxed validation)
      if (blockText.includes('₪') || /\d+\s*חד[׳'ר]/.test(blockText) || /\d+\s*מ"ר/.test(blockText) || /קומות/.test(blockText) || /פרויקט/.test(blockText)) {
        blocks.push(blockText);
      }
      continue;
    }
    
    // Format C: Simple link without image prefix (sometimes appears for projects)
    if (line.match(/^\[([^\]]+)\]\(https:\/\/www\.madlan\.co\.il\/(listings|projects)\//) && !line.startsWith('[![')) {
      // This is a text link - collect following lines
      const blockLines: string[] = [line];
      
      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        const nextLine = lines[j];
        const nextLineTrimmed = nextLine.trim();
        
        if (nextLineTrimmed.startsWith('[') && (nextLineTrimmed.includes('/listings/') || nextLineTrimmed.includes('/projects/'))) {
          break;
        }
        if (nextLineTrimmed.startsWith('## ') || nextLineTrimmed.startsWith('# ')) {
          break;
        }
        
        blockLines.push(nextLine);
        
        if (nextLineTrimmed === 'תיווך' || nextLineTrimmed === 'בבלעדיות') {
          break;
        }
      }
      
      const blockText = blockLines.join('\n');
      if (blockText.includes('₪') || /\d+\s*חד[׳'ר]/.test(blockText) || /\d+\s*מ"ר/.test(blockText) || /קומות/.test(blockText)) {
        blocks.push(blockText);
      }
    }
  }
  
  return blocks;
}

// ============================================
// Block Parsing - Extract fields from either format
// ============================================

/**
 * Known Tel Aviv neighborhoods with patterns for detection
 */
const KNOWN_NEIGHBORHOODS = [
  { pattern: /צפון\s*(?:ה)?ישן|הצפון\s*הישן/i, value: 'צפון_ישן', label: 'צפון ישן' },
  { pattern: /צפון\s*(?:ה)?חדש|הצפון\s*החדש/i, value: 'צפון_חדש', label: 'צפון חדש' },
  { pattern: /נמל\s*תל\s*אביב|יורדי\s*הסירה/i, value: 'נמל_תל_אביב', label: 'נמל תל אביב' },
  { pattern: /לב\s*(?:ה)?עיר/i, value: 'לב_העיר', label: 'לב העיר' },
  { pattern: /פלורנטין/i, value: 'פלורנטין', label: 'פלורנטין' },
  { pattern: /נווה\s*צדק/i, value: 'נווה_צדק', label: 'נווה צדק' },
  { pattern: /כרם\s*(?:ה)?תימנים/i, value: 'כרם_התימנים', label: 'כרם התימנים' },
  { pattern: /רמת\s*אביב\s*(?:ה)?חדשה/i, value: 'רמת_אביב_החדשה', label: 'רמת אביב החדשה' },
  { pattern: /רמת\s*אביב\s*ג'?/i, value: 'רמת_אביב_ג', label: "רמת אביב ג'" },
  { pattern: /רמת\s*אביב/i, value: 'רמת_אביב', label: 'רמת אביב' },
  { pattern: /אפקה/i, value: 'אפקה', label: 'אפקה' },
  { pattern: /נווה\s*אביבים/i, value: 'נווה_אביבים', label: 'נווה אביבים' },
  { pattern: /יפו\s*(?:ה)?עתיקה|עג'?מי/i, value: 'יפו', label: 'יפו' },
  { pattern: /שפירא/i, value: 'שפירא', label: 'שפירא' },
  { pattern: /מונטיפיורי/i, value: 'מונטיפיורי', label: 'מונטיפיורי' },
  { pattern: /הדר\s*יוסף/i, value: 'הדר_יוסף', label: 'הדר יוסף' },
  { pattern: /בבלי/i, value: 'בבלי', label: 'בבלי' },
  { pattern: /קרית\s*שלום/i, value: 'קרית_שלום', label: 'קרית שלום' },
  { pattern: /נוה\s*שאנן|נווה\s*שאנן/i, value: 'נווה_שאנן', label: 'נווה שאנן' },
  { pattern: /שכונת\s*התקווה/i, value: 'התקווה', label: 'שכונת התקווה' },
];

/**
 * Extract neighborhood from entire block text
 */
function extractNeighborhoodFromBlock(block: string): { label: string; value: string } | null {
  for (const { pattern, value, label } of KNOWN_NEIGHBORHOODS) {
    if (pattern.test(block)) {
      return { value, label };
    }
  }
  return null;
}

function parsePropertyBlock(block: string, propertyType: 'rent' | 'sale'): ParsedProperty | null {
  // Extract listing OR project URL and ID
  const urlMatch = block.match(/https:\/\/www\.madlan\.co\.il\/(listings|projects)\/([^\)\s\]]+)/);
  if (!urlMatch) return null;
  
  const urlType = urlMatch[1]; // 'listings' or 'projects'
  const sourceId = urlMatch[2].replace(/\)$/, ''); // Clean trailing )
  const sourceUrl = `https://www.madlan.co.il/${urlType}/${sourceId}`;
  
  // Filter out projects (new construction) - we only want second-hand listings
  const isProject = urlType === 'projects' || block.includes('פרויקט') || block.includes('מקבלן');
  if (isProject) {
    return null; // Skip projects entirely
  }
  
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
  
  // Extract address and neighborhood
  let address: string | null = null;
  let neighborhood: string | null = null;
  let neighborhoodValue: string | null = null;
  const city = 'תל אביב יפו';
  
  // First: Try to extract neighborhood from the ENTIRE block (most reliable)
  const blockNeighborhood = extractNeighborhoodFromBlock(block);
  if (blockNeighborhood) {
    neighborhood = blockNeighborhood.label;
    neighborhoodValue = blockNeighborhood.value;
  }
  
  // Look for property type patterns like "דירה, כתובת, שכונה"
  for (const part of parts) {
    const typePattern = /^(דירה|דירת גג|פנטהאוז|סטודיו|גן|קוטג'?|בית פרטי)/;
    if (typePattern.test(part)) {
      const segments = part.split(',').map(s => s.trim());
      if (segments.length >= 2) {
        address = cleanText(segments[1]);
      }
      // If we didn't find neighborhood from block, try from segments
      if (!neighborhood && segments.length >= 3) {
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
      const altParts = altText.split(',').map(p => p.trim());
      if (altParts.length >= 1 && !altParts[0].includes('תל אביב')) {
        address = cleanText(altParts[0]);
      }
    }
  }
  
  // Skip if no useful data extracted
  if (!price && !rooms && !address && !size) return null;
  
  // Detect broker
  const hasAgentImage = block.includes('[![](https://') && (block.includes('/agents/') || block.includes('/developers/'));
  const hasBrokerKeyword = /תיווך|בבלעדיות|מתווך/.test(block);
  const isBroker = hasBrokerKeyword || hasAgentImage || detectBroker(block);
  
  // Extract features from the entire block
  const features = extractFeatures(block);
  
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
    features,
    raw_text: block.substring(0, 500)
  };
}

// ============================================
// Content Cleaning - Remove noise before parsing
// ============================================

function cleanMadlanContent(markdown: string): string {
  let cleaned = markdown;
  
  // 1. Skip navigation - find the listings header (more flexible patterns)
  const headerPatterns = [
    /# דירות להשכרה/,
    /# דירות למכירה/,
    /## \d+ דירות להשכרה/,
    /## \d+ דירות למכירה/,
    /דירות להשכרה בתל אביב/,
    /דירות למכירה בתל אביב/,
    /מיינו לפי:/  // Sort selector appears just before listings
  ];
  
  for (const pattern of headerPatterns) {
    const match = cleaned.search(pattern);
    if (match > 100) {
      // Keep from this header onwards
      cleaned = cleaned.substring(match);
      console.log(`[Madlan Clean] Skipped ${match} chars of navigation`);
      break;
    }
  }
  
  // 2. Remove blog section "יעניין אותך לדעת" - this appears mid-page
  const blogPatterns = [
    '## יעניין אותך לדעת',
    '## כתבות שיעניינו אותך',
    '### יעניין אותך',
    '![](https://images2.madlan.co.il/t:nonce:v=2;convert:type=webp/realEstateAgent/office/' // Agent promotion blocks
  ];
  
  for (const blogStart of blogPatterns) {
    const blogIdx = cleaned.indexOf(blogStart);
    if (blogIdx > 0) {
      // Find where listings resume (next property block)
      const afterBlog = cleaned.substring(blogIdx);
      const nextListingMatch = afterBlog.search(/\n\[!\[[^\]]+\]\([^\)]+\)\]\(https:\/\/www\.madlan\.co\.il\/(listings|projects)/);
      
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
      console.log(`[Madlan Clean] Trimmed ${cleaned.length - match} chars of footer`);
      cleaned = cleaned.substring(0, match);
    }
  }
  
  return cleaned;
}
