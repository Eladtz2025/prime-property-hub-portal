/**
 * Madlan Markdown Parser
 * 
 * Parses property listings from Madlan markdown.
 * Handles THREE distinct formats:
 * 
 * Format A - Broker listings (fragmented blocks, Firecrawl):
 * [![Address, City](IMG_URL)](listing_url)
 * [![](AGENT_IMG)](agent_url)
 * ‏Price ‏₪
 * X חד׳
 * קומה Y
 * Z מ"ר
 * Type, Street, Neighborhood
 * תיווך
 * 
 * Format B - Private listings (compact block with \\, Firecrawl):
 * [![Address, City](IMG_URL)\\
 * \\
 * ‏Price ‏₪\\
 * ...
 * Type, Street, Neighborhood](listing_url)
 * 
 * Format D - Jina single-line format (both broker & private):
 * [![Image X: Address, City](IMG) [![Image Y: ...](AGENT_IMG)](agentsOffice/...) Price₪ X חד׳ קומה Y Z מ"ר Type, Street, Neighborhood תיווך](listing_url)
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
  propertyType: 'rent' | 'sale',
  ownerTypeFilter?: 'private' | 'broker' | null
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
        // Filter by owner type at the earliest stage
        if (ownerTypeFilter === 'private' && parsed.is_private !== true) continue;
        if (ownerTypeFilter === 'broker' && parsed.is_private !== false) continue;
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
      private_count: properties.filter(p => p.is_private === true).length,
      broker_count: properties.filter(p => p.is_private === false).length,
      unknown_count: properties.filter(p => p.is_private === null).length,
    },
    errors
  };
}

export const parseMadlanHtml = parseMadlanMarkdown;

// ============================================
// Block Detection - Handles Format A, B & D (Jina)
// ============================================

function findPropertyBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const lines = markdown.split('\n');
  const capturedUrls = new Set<string>();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // =============================================
    // FORMAT D DETECTION (Jina single-line format)
    // Entire listing is on one line:
    // [![Image X: addr](IMG) ... content ... תיווך](listing_url)
    // The listing URL is at the END of the line as a wrapping link
    // =============================================
    if (line.startsWith('[![Image') && line.includes('madlan.co.il/listings/')) {
      // Extract listing URL from the END of the line (wrapping link)
      const urlMatch = line.match(/https:\/\/www\.madlan\.co\.il\/listings\/([^\)\s\]]+)/);
      if (urlMatch) {
        const urlId = urlMatch[1].replace(/\)$/, '');
        if (!capturedUrls.has(urlId)) {
          // Verify it has property data
          if (line.includes('₪') || /\d+\s*חד[׳'ר]/.test(line) || /\d+\s*מ"ר/.test(line)) {
            blocks.push(line);
            capturedUrls.add(urlId);
          }
        }
      }
      continue;
    }
    
    // =============================================
    // FORMAT B DETECTION (PRIVATE listings, Firecrawl)
    // Multi-line block: starts with [![...](IMG)\\
    // and ends with ...](https://www.madlan.co.il/listings/XXX)
    // The listing URL is on the LAST line, not the first!
    // =============================================
    if (line.startsWith('[![') && line.endsWith('\\\\') && !line.includes('madlan.co.il/listings/')) {
      const blockLines: string[] = [line];
      let foundListing = false;
      
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const nextLine = lines[j].trim();
        blockLines.push(nextLine);
        
        const listingMatch = nextLine.match(/\]\(https:\/\/www\.madlan\.co\.il\/listings\/([^\)\s]+)/);
        if (listingMatch) {
          const urlId = listingMatch[1].replace(/\)$/, '');
          if (!capturedUrls.has(urlId)) {
            const blockText = blockLines.join('\n');
            if (blockText.includes('₪') || /\d+\s*חד[׳'ר]/.test(blockText) || /\d+\s*מ"ר/.test(blockText)) {
              blocks.push(blockText);
              capturedUrls.add(urlId);
            }
          }
          foundListing = true;
          i = j;
          break;
        }
        
        if (nextLine.startsWith('[![') && !nextLine.endsWith('\\\\') && !nextLine.endsWith('\\')) {
          break;
        }
        if (nextLine.startsWith('## ') || nextLine.startsWith('# ')) {
          break;
        }
      }
      
      if (foundListing) continue;
    }
    
    // For remaining formats, require listing URL on this line
    const hasListingUrl = line.includes('madlan.co.il/listings/');
    if (!hasListingUrl) continue;
    
    // Skip project/search patterns
    if (line.includes('/projects/') || line.includes('/for-rent/') || line.includes('/for-sale/')) {
      continue;
    }
    
    // Skip duplicates
    const urlMatch = line.match(/https:\/\/www\.madlan\.co\.il\/listings\/([^\)\s\]]+)/);
    if (urlMatch) {
      const urlId = urlMatch[1].replace(/\)$/, '');
      if (capturedUrls.has(urlId)) continue;
      capturedUrls.add(urlId);
    }
    
    // FORMAT A: Fragmented block - listing URL in image link, details follow
    if (line.match(/^\[!\[[^\]]*\]\([^\)]+\)\]\(https:\/\/www\.madlan\.co\.il\/listings\//)) {
      const blockLines: string[] = [line];
      
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const nextLine = lines[j];
        const nextLineTrimmed = nextLine.trim();
        
        if (nextLineTrimmed.startsWith('[![') && (nextLineTrimmed.includes('/listings/') || nextLineTrimmed.endsWith('\\\\'))) {
          break;
        }
        
        if (nextLineTrimmed.startsWith('## ') || nextLineTrimmed.startsWith('# ')) {
          break;
        }
        
        if (nextLineTrimmed.includes('משרד מוביל') || nextLineTrimmed.includes('צרו קשר עם המשרד')) {
          break;
        }
        
        blockLines.push(nextLine);
        
        if (nextLineTrimmed === 'תיווך' || nextLineTrimmed === 'בבלעדיות') {
          break;
        }
      }
      
      const blockText = blockLines.join('\n');
      if (blockText.includes('₪') || /\d+\s*חד[׳'ר]/.test(blockText) || /\d+\s*מ"ר/.test(blockText) || /קומות/.test(blockText) || /פרויקט/.test(blockText)) {
        blocks.push(blockText);
      }
      continue;
    }
    
    // FORMAT C: Simple link without image prefix 
    if (line.match(/^\[([^\]]+)\]\(https:\/\/www\.madlan\.co\.il\/listings\//) && !line.startsWith('[![')) {
      const blockLines: string[] = [line];
      
      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        const nextLine = lines[j];
        const nextLineTrimmed = nextLine.trim();
        
        if (nextLineTrimmed.startsWith('[') && nextLineTrimmed.includes('/listings/')) {
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
  // יפו - only match explicit Jaffa neighborhoods, NOT as a fallback
  { pattern: /יפו\s*(?:ה)?עתיקה|עג'?מי|נוגה/i, value: 'יפו', label: 'יפו' },
  { pattern: /שפירא/i, value: 'שפירא', label: 'שפירא' },
  { pattern: /מונטיפיורי/i, value: 'מונטיפיורי', label: 'מונטיפיורי' },
  { pattern: /הדר\s*יוסף/i, value: 'הדר_יוסף', label: 'הדר יוסף' },
  { pattern: /בבלי/i, value: 'בבלי', label: 'בבלי' },
  { pattern: /קרית\s*שלום/i, value: 'קרית_שלום', label: 'קרית שלום' },
  { pattern: /נוה\s*שאנן|נווה\s*שאנן/i, value: 'נווה_שאנן', label: 'נווה שאנן' },
  { pattern: /שכונת\s*התקווה/i, value: 'התקווה', label: 'שכונת התקווה' },
  { pattern: /כיכר\s*המדינה/i, value: 'כיכר_המדינה', label: 'כיכר המדינה' },
  { pattern: /לב\s*תל\s*אביב/i, value: 'לב_תל_אביב', label: 'לב תל אביב' },
];

/**
 * Street to neighborhood mapping for Tel Aviv
 * Used as fallback when neighborhood is not detected from block
 */
const STREET_TO_NEIGHBORHOOD: Record<string, { value: string; label: string }> = {
  // לב העיר / מרכז העיר
  'פינסקר': { value: 'לב_העיר', label: 'לב העיר' },
  'בוגרשוב': { value: 'לב_העיר', label: 'לב העיר' },
  'אלנבי': { value: 'לב_העיר', label: 'לב העיר' },
  'שינקין': { value: 'לב_העיר', label: 'לב העיר' },
  'רוטשילד': { value: 'לב_העיר', label: 'לב העיר' },
  'הרצל': { value: 'לב_העיר', label: 'לב העיר' },
  'מונטיפיורי': { value: 'לב_העיר', label: 'לב העיר' },
  'נחלת בנימין': { value: 'לב_העיר', label: 'לב העיר' },
  
  // צפון ישן
  'בן יהודה': { value: 'צפון_ישן', label: 'צפון ישן' },
  'דיזנגוף': { value: 'צפון_ישן', label: 'צפון ישן' },
  'ארלוזורוב': { value: 'צפון_ישן', label: 'צפון ישן' },
  'נורדאו': { value: 'צפון_ישן', label: 'צפון ישן' },
  'גורדון': { value: 'צפון_ישן', label: 'צפון ישן' },
  'פרישמן': { value: 'צפון_ישן', label: 'צפון ישן' },
  'מפו': { value: 'צפון_ישן', label: 'צפון ישן' },
  'ירמיהו': { value: 'צפון_ישן', label: 'צפון ישן' },
  'יהושע בן נון': { value: 'צפון_ישן', label: 'צפון ישן' },
  'הירקון': { value: 'צפון_ישן', label: 'צפון ישן' },
  'הירדן': { value: 'צפון_ישן', label: 'צפון ישן' },
  
  // צפון חדש  
  'ליאונרדו': { value: 'צפון_חדש', label: 'צפון חדש' },
  'שלום עליכם': { value: 'צפון_חדש', label: 'צפון חדש' },
  "ז'בוטינסקי": { value: 'צפון_חדש', label: 'צפון חדש' },
  'ז\'בוטינסקי': { value: 'צפון_חדש', label: 'צפון חדש' },
  'ויצמן': { value: 'צפון_חדש', label: 'צפון חדש' },
  'פנקס': { value: 'צפון_חדש', label: 'צפון חדש' },
  'יהודה המכבי': { value: 'צפון_חדש', label: 'צפון חדש' },
  'בלפור': { value: 'צפון_חדש', label: 'צפון חדש' },
  
  // בבלי
  'שיכון בבלי': { value: 'בבלי', label: 'בבלי' },
  
  // רמת אביב
  'איינשטיין': { value: 'רמת_אביב', label: 'רמת אביב' },
  'ברודצקי': { value: 'רמת_אביב', label: 'רמת אביב' },
  'לוי אשכול': { value: 'רמת_אביב', label: 'רמת אביב' },
  'קלאוזנר': { value: 'רמת_אביב', label: 'רמת אביב' },
  
  // פלורנטין
  'פלורנטין': { value: 'פלורנטין', label: 'פלורנטין' },
  'סלמה': { value: 'פלורנטין', label: 'פלורנטין' },
  
  // נווה צדק
  'שבזי': { value: 'נווה_צדק', label: 'נווה צדק' },
  'אחד העם': { value: 'נווה_צדק', label: 'נווה צדק' },
  'לילינבלום': { value: 'נווה_צדק', label: 'נווה צדק' },
  'יהודית': { value: 'נווה_צדק', label: 'נווה צדק' },
  
  // כרם התימנים
  'נחלת בנימין': { value: 'כרם_התימנים', label: 'כרם התימנים' },
};

/**
 * Try to detect neighborhood from street address
 */
function extractNeighborhoodFromAddress(address: string): { value: string; label: string } | null {
  if (!address) return null;
  
  for (const [street, info] of Object.entries(STREET_TO_NEIGHBORHOOD)) {
    if (address.includes(street)) {
      return info;
    }
  }
  return null;
}

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
  // Extract listing URL and ID - ONLY /listings/ URLs are valid
  const urlMatch = block.match(/https:\/\/www\.madlan\.co\.il\/listings\/([^\)\s\]]+)/);
  if (!urlMatch) return null;
  
  const sourceId = urlMatch[1].replace(/\)$/, ''); // Clean trailing )
  const sourceUrl = `https://www.madlan.co.il/listings/${sourceId}`;
  
  // Double-check: Skip any project/search URLs that slipped through
  if (block.includes('/projects/') || block.includes('/for-rent/') || block.includes('/for-sale/')) {
    return null;
  }
  
  // Filter out new construction listings
  const isProject = block.includes('פרויקט') || block.includes('מקבלן');
  if (isProject) {
    return null; // Skip projects entirely
  }
  
  // Determine block format and split accordingly
  const isCompactBlock = block.includes('\\\\') && block.startsWith('[![');
  const isJinaSingleLine = block.startsWith('[![Image') && !block.includes('\n');
  
  let parts: string[];
  if (isJinaSingleLine) {
    // Format D (Jina): Single line - extract the text content between images/links and the listing URL
    // Strip markdown images and links to get plain text content
    const plainText = block
      .replace(/\[!\[[^\]]*\]\([^\)]*\)/g, '') // Remove [![alt](url) image tags
      .replace(/\]\(https:\/\/www\.madlan\.co\.il\/[^\)]*\)/g, '') // Remove ](listing_url)
      .replace(/\]\(https:\/\/www\.madlan\.co\.il\/agentsOffice\/[^\)]*\)/g, '') // Remove agent links
      .replace(/[\u200F\u200E\u202A-\u202E\u2066-\u2069]/g, '') // Remove RTL/LTR marks
      .trim();
    // Split by spaces but keep meaningful chunks together
    parts = plainText.split(/\s+/).filter(p => p.length > 0);
    // Also create pseudo-parts for field extraction by joining back
    // The plainText will be: "13,900₪ 4 חד׳ קומה 1 120 מ"ר דירה, בלקינד , הצפון החדש תיווך"
    parts = [plainText]; // Use the whole cleaned text as one part for field extraction
  } else if (isCompactBlock) {
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
  
  // For Jina single-line format, extract fields directly from the raw block
  // because the parts-based approach doesn't work well with one giant part
  let price: number | null = null;
  let rooms: number | null = null;
  let floor: number | null = null;
  let size: number | null = null;
  
  if (isJinaSingleLine) {
    // Clean ALL RTL/LTR/bidi control characters before numeric extraction
    // This prevents digits from adjacent fields (e.g. rooms) being concatenated with the price
    const cleanedBlock = block.replace(/[\u200F\u200E\u202A-\u202E\u2066-\u2069\u200B-\u200D]/g, '');
    
    // Strategy 1 (preferred): Combined price+rooms regex
    // Madlan Jina format is: "PRICE₪ ROOMS חד׳" - capture both at once
    // to prevent digit concatenation (e.g. 8,000,000₪1 חד׳ → 80000001)
    const priceRoomsMatch = cleanedBlock.match(/([\d,]+)\s*₪\s*(\d+\.?\d*)\s*חד[׳'ר]/);
    if (priceRoomsMatch) {
      const priceStr = priceRoomsMatch[1].replace(/,/g, '');
      const priceNum = parseInt(priceStr, 10);
      if (priceNum >= 500 && priceNum <= 100000000) price = priceNum;
      rooms = parseFloat(priceRoomsMatch[2]);
    } else {
      // Strategy 2: Strict comma-formatted price regex (X,XXX,XXX₪)
      // Only matches properly comma-separated numbers to avoid grabbing concatenated digits
      const strictPriceMatch = cleanedBlock.match(/(\d{1,3}(?:,\d{3})+)\s*₪/);
      if (strictPriceMatch) {
        const priceStr = strictPriceMatch[1].replace(/,/g, '');
        const priceNum = parseInt(priceStr, 10);
        if (priceNum >= 500 && priceNum <= 100000000) price = priceNum;
      } else {
        // Strategy 3: Simple number₪ with max sanity check
        const simplePriceMatch = cleanedBlock.match(/([\d,]+)\s*₪/);
        if (simplePriceMatch) {
          const priceStr = simplePriceMatch[1].replace(/,/g, '');
          const priceNum = parseInt(priceStr, 10);
          // For sale: max 50M, for rent: max 100K - if over, likely concatenated
          const maxPrice = propertyType === 'sale' ? 50000000 : 100000;
          if (priceNum >= 500 && priceNum <= maxPrice) price = priceNum;
        }
      }
      
      // Extract rooms separately if not found via combined match
      const roomsMatch = cleanedBlock.match(/(\d+\.?\d*)\s*חד[׳'ר]/);
      if (roomsMatch) rooms = parseFloat(roomsMatch[1]);
    }
    
    // Extract floor: "קומה X" or "קומת קרקע"
    const floorMatch = cleanedBlock.match(/קומה\s+(\d+)/);
    if (floorMatch) floor = parseInt(floorMatch[1], 10);
    else if (/קומת\s*קרקע/.test(cleanedBlock)) floor = 0;
    
    // Extract size: "X מ"ר"
    const sizeMatch = cleanedBlock.match(/(\d+)\s*מ"ר/);
    if (sizeMatch) size = parseInt(sizeMatch[1], 10);
  } else {
    // Original parts-based extraction for Format A/B/C
    const pricePart = parts.find(p => p.includes('₪'));
    price = pricePart ? extractPrice(pricePart) : null;
    
    const roomsPart = parts.find(p => /\d+\.?\d*\s*חד[׳'ר]/.test(p));
    rooms = roomsPart ? extractRooms(roomsPart) : null;
    
    const floorPart = parts.find(p => /קומה/.test(p));
    floor = floorPart ? extractFloor(floorPart) : null;
    
    const sizePart = parts.find(p => /\d+\s*מ"ר|\d+\s*מ״ר/.test(p));
    size = sizePart ? extractSize(sizePart) : null;
  }
  
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
  let typeAddress: string | null = null;
  for (const part of parts) {
    const typePattern = /^(דירה|דירת גג|פנטהאוז|סטודיו|גן|קוטג'?|בית פרטי)/;
    if (typePattern.test(part)) {
      const segments = part.split(',').map(s => s.trim());
      if (segments.length >= 2) {
        typeAddress = cleanText(segments[1]);
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
  
  // Also check alt text for address (may contain house number)
  // Jina adds "Image XX: " prefix to alt text, clean it
  let altAddress: string | null = null;
  const altMatch = block.match(/\[!\[(?:Image\s*\d+:\s*)?([^\]]+)\]/);
  if (altMatch) {
    const altText = altMatch[1];
    const altParts = altText.split(',').map(p => p.trim());
    if (altParts.length >= 1 && !altParts[0].includes('תל אביב')) {
      altAddress = cleanText(altParts[0]);
    }
  }
  
  // Prefer address WITH house number over one without
  const typeHasNum = typeAddress && /\d{1,3}/.test(typeAddress);
  const altHasNum = altAddress && /\d{1,3}/.test(altAddress);
  
  if (typeHasNum) {
    address = typeAddress;
  } else if (altHasNum) {
    address = altAddress;
  } else {
    address = typeAddress || altAddress;
  }
  
  // If no neighborhood found from block patterns, try to detect from address
  if (!neighborhood && address) {
    const addressNeighborhood = extractNeighborhoodFromAddress(address);
    if (addressNeighborhood) {
      neighborhood = addressNeighborhood.label;
      neighborhoodValue = addressNeighborhood.value;
    }
  }
  
  // Skip if no useful data extracted
  if (!price && !rooms && !address && !size) return null;
  
  // ============================================
  // BROKER DETECTION - Madlan (SERP labels)
  // Rule: "תיווך" or "בלעדיות" label = Broker
  //        No label = Private
  // This matches the visual layout on madlan.co.il
  // ============================================
  
  let isPrivate: boolean | null = null;
  
  // Check for broker labels
  // Firecrawl: "תיווך" appears as standalone line
  // Jina: "תיווך" appears inline before the closing ](url)
  const hasTivuchLabel = /^תיווך$/m.test(block) || /\nתיווך\n/.test(block) || /\nתיווך$/.test(block)
    || /תיווך\]\(/.test(block) || / תיווך\]/.test(block);
  const hasExclusivity = /^בבלעדיות$/m.test(block) || /\nבבלעדיות\n/.test(block) || /\nבבלעדיות$/.test(block)
    || /בבלעדיות\]\(/.test(block) || / בבלעדיות\]/.test(block);
  const hasAgentOfficeLink = block.includes('agentsOffice') || block.includes('/agents/');
  // "מתיווך" appears inline in some broker listings (means "from broker")
  const hasMeTivuch = /מתיווך/.test(block);
  // Agent image: [![ linking to realEstateAgent or realEstateOffice image
  // Firecrawl: [![](https://images2.madlan.co.il/...realEstateAgent...)
  // Jina: [![Image XX: ...](https://images2.madlan.co.il/...realEstateAgent...)
  const hasAgentImage = /\[!\[(?:Image\s*\d+:[^\]]*)?\]\(https:\/\/images2\.madlan\.co\.il\/.*(?:realEstateAgent|realEstateOffice)/.test(block);
  
  if (hasTivuchLabel || hasExclusivity || hasAgentOfficeLink || hasMeTivuch || hasAgentImage) {
    isPrivate = false; // Broker
  } else {
    isPrivate = true; // No broker label = Private
  }
  
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
    source_id: sourceId,  // Use raw listing ID without prefix - generateSourceId already adds source prefix
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
    raw_text: block.substring(0, 1000)
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
      // Supports Format A/B (Firecrawl: [![alt](IMG)](listing_url))
      // AND Format D (Jina: [![Image N: ...](IMG) ... ](listing_url) on a single line)
      const afterBlog = cleaned.substring(blogIdx);
      const nextListingMatch = afterBlog.search(
        /\n\[!\[[^\]]*\][\s\S]{0,3000}?https:\/\/www\.madlan\.co\.il\/(listings|projects)\//
      );
      
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
