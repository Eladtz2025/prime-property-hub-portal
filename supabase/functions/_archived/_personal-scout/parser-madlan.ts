/**
 * Madlan Markdown Parser - Personal Scout Version
 * 
 * ISOLATED COPY - Does not modify production code
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
// Known Tel Aviv neighborhoods with patterns for detection
// ============================================

const KNOWN_NEIGHBORHOODS = [
  { pattern: /צפון\s*(?:ה)?ישן|הצפון\s*הישן/i, value: 'צפון_ישן', label: 'צפון ישן' },
  { pattern: /צפון\s*(?:ה)?חדש|הצפון\s*החדש/i, value: 'צפון_חדש', label: 'צפון חדש' },
  { pattern: /נמל\s*תל\s*אביב|יורדי\s*הסירה/i, value: 'נמל_תל_אביב', label: 'נמל תל אביב' },
  { pattern: /לב\s*(?:ה)?עיר/i, value: 'לב_העיר', label: 'לב העיר' },
  { pattern: /לב\s*תל\s*אביב/i, value: 'לב_תל_אביב', label: 'לב תל אביב' },
  { pattern: /פלורנטין/i, value: 'פלורנטין', label: 'פלורנטין' },
  { pattern: /נווה\s*צדק|נוה\s*צדק/i, value: 'נווה_צדק', label: 'נווה צדק' },
  { pattern: /כרם\s*(?:ה)?תימנים/i, value: 'כרם_התימנים', label: 'כרם התימנים' },
  { pattern: /רמת\s*אביב\s*(?:ה)?חדשה/i, value: 'רמת_אביב_החדשה', label: 'רמת אביב החדשה' },
  { pattern: /רמת\s*אביב\s*ג'?/i, value: 'רמת_אביב_ג', label: "רמת אביב ג'" },
  { pattern: /רמת\s*אביב/i, value: 'רמת_אביב', label: 'רמת אביב' },
  { pattern: /רמת\s*החייל/i, value: 'רמת_החייל', label: 'רמת החייל' },
  { pattern: /אפקה/i, value: 'אפקה', label: 'אפקה' },
  { pattern: /נווה\s*אביבים|נוה\s*אביבים/i, value: 'נווה_אביבים', label: 'נווה אביבים' },
  { pattern: /נווה\s*עופר|נוה\s*עופר/i, value: 'נווה_עופר', label: 'נווה עופר' },
  { pattern: /נווה\s*חן|נוה\s*חן/i, value: 'נווה_חן', label: 'נווה חן' },
  { pattern: /נווה\s*אליעזר|נוה\s*אליעזר/i, value: 'נווה_אליעזר', label: 'נווה אליעזר' },
  { pattern: /נווה\s*צה"?ל|נוה\s*צה"?ל/i, value: 'נווה_צהל', label: 'נווה צה"ל' },
  { pattern: /יפו\s*(?:ה)?עתיקה|עג'?מי/i, value: 'יפו', label: 'יפו' },
  { pattern: /שפירא/i, value: 'שפירא', label: 'שפירא' },
  { pattern: /מונטיפיורי/i, value: 'מונטיפיורי', label: 'מונטיפיורי' },
  { pattern: /הדר\s*יוסף/i, value: 'הדר_יוסף', label: 'הדר יוסף' },
  { pattern: /בבלי/i, value: 'בבלי', label: 'בבלי' },
  { pattern: /קרית\s*שלום/i, value: 'קרית_שלום', label: 'קרית שלום' },
  { pattern: /קרית\s*אליעזר/i, value: 'קרית_אליעזר', label: 'קרית אליעזר' },
  { pattern: /נוה\s*שאנן|נווה\s*שאנן/i, value: 'נווה_שאנן', label: 'נווה שאנן' },
  { pattern: /שכונת\s*התקווה/i, value: 'התקווה', label: 'שכונת התקווה' },
  { pattern: /גני\s*שרונה|שרונה/i, value: 'שרונה', label: 'שרונה' },
  { pattern: /נחלת\s*בנימין/i, value: 'נחלת_בנימין', label: 'נחלת בנימין' },
  { pattern: /גן\s*העיר/i, value: 'גן_העיר', label: 'גן העיר' },
  { pattern: /יד\s*אליהו/i, value: 'יד_אליהו', label: 'יד אליהו' },
  { pattern: /כפר\s*שלם/i, value: 'כפר_שלם', label: 'כפר שלם' },
  { pattern: /ניר\s*אביב/i, value: 'ניר_אביב', label: 'ניר אביב' },
  { pattern: /ליבנה/i, value: 'ליבנה', label: 'ליבנה' },
  { pattern: /תל\s*חיים/i, value: 'תל_חיים', label: 'תל חיים' },
  { pattern: /שיכון\s*עממי/i, value: 'שיכון_עממי', label: 'שיכון עממי' },
  { pattern: /כיכר\s*המדינה/i, value: 'כיכר_המדינה', label: 'כיכר המדינה' },
  { pattern: /רוטשילד/i, value: 'רוטשילד', label: 'רוטשילד' },
  { pattern: /צהלה/i, value: 'צהלה', label: 'צהלה' },
  // Additional neighborhoods found in data
  { pattern: /תל\s*ברוך\s*צפון/i, value: 'תל_ברוך_צפון', label: 'תל ברוך צפון' },
  { pattern: /תל\s*ברוך/i, value: 'תל_ברוך', label: 'תל ברוך' },
  { pattern: /אזורי\s*חן/i, value: 'אזורי_חן', label: 'אזורי חן' },
  { pattern: /הדר/i, value: 'הדר', label: 'הדר' },
  { pattern: /יד\s*לבנים/i, value: 'יד_לבנים', label: 'יד לבנים' },
  { pattern: /תוכנית\s*ל/i, value: 'תוכנית_ל', label: 'תוכנית ל' },
  { pattern: /הסבוראים/i, value: 'הסבוראים', label: 'הסבוראים' },
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

// ============================================
// Main Entry Point
// ============================================

export function parseMadlanMarkdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  console.log(`[personal-scout/parser-madlan] Input: ${markdown.length} chars`);
  
  const cleaned = cleanMadlanContent(markdown);
  console.log(`[personal-scout/parser-madlan] After cleaning: ${cleaned.length} chars`);
  
  const blocks = findPropertyBlocks(cleaned);
  console.log(`[personal-scout/parser-madlan] Found ${blocks.length} property blocks`);
  
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
  
  console.log(`[personal-scout/parser-madlan] ✅ Parsed ${properties.length} properties`);
  console.log(`[personal-scout/parser-madlan] Neighborhoods found: ${properties.filter(p => p.neighborhood).length}`);
  
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
      with_neighborhood: properties.filter(p => p.neighborhood !== null).length,
      private_count: properties.filter(p => p.is_private).length,
      broker_count: properties.filter(p => !p.is_private).length,
    },
    errors
  };
}

// ============================================
// Block Detection
// ============================================

function findPropertyBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const lines = markdown.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const hasListingUrl = line.includes('madlan.co.il/listings/') || line.includes('madlan.co.il/projects/');
    
    if (!hasListingUrl) continue;
    
    const urlMatch = line.match(/https:\/\/www\.madlan\.co\.il\/(listings|projects)\/([^\)\s\]]+)/);
    if (urlMatch) {
      const urlId = urlMatch[2];
      if (blocks.some(b => b.includes(urlId))) continue;
    }
    
    if (line.includes('\\\\') || line.includes('\\\n')) {
      if (line.includes('₪') || /\d+\s*חד[׳'ר]/.test(line) || /\d+\s*מ"ר/.test(line) || /קומות/.test(line)) {
        blocks.push(line);
      }
      continue;
    }
    
    if (line.match(/^\[!\[[^\]]*\]\([^\)]+\)\]\(https:\/\/www\.madlan\.co\.il\/(listings|projects)\//)) {
      const blockLines: string[] = [line];
      
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const nextLine = lines[j];
        const nextLineTrimmed = nextLine.trim();
        
        if (nextLineTrimmed.startsWith('[![') && (nextLineTrimmed.includes('/listings/') || nextLineTrimmed.includes('/projects/'))) {
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
    
    if (line.match(/^\[([^\]]+)\]\(https:\/\/www\.madlan\.co\.il\/(listings|projects)\//) && !line.startsWith('[![')) {
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
// Block Parsing
// ============================================

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
    console.log(`[personal-scout/parser-madlan] Skipping project: ${sourceId}`);
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
  
  // If address looks like a neighborhood name (no street number), use it as neighborhood
  if (address && !neighborhood) {
    const hasStreetNumber = /\d+/.test(address);
    if (!hasStreetNumber) {
      // Check if address matches a known neighborhood
      const addressAsNeighborhood = extractNeighborhoodFromBlock(address);
      if (addressAsNeighborhood) {
        neighborhood = addressAsNeighborhood.label;
        neighborhoodValue = addressAsNeighborhood.value;
      } else {
        // Just use the address as neighborhood if it doesn't have a street number
        neighborhood = address;
      }
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
  
  // Detect broker - Madlan has explicit "תיווך" marker for broker listings
  // Also check for agent images and other indicators
  const hasAgentImage = block.includes('[![](https://') && (block.includes('/agents/') || block.includes('/developers/'));
  
  // Extended broker keywords for Madlan
  const brokerKeywords = [
    'תיווך', 'בבלעדיות', 'מתווך', 'מתווכת',
    'משרד נדל"ן', 'משרד נדלן', 'סוכנות',
    'real estate', 'agency', 'Properties', 'Premium',
    'רימקס', 'אנגלו סכסון', 're/max', 'remax', 'century 21',
    'קולדוול בנקר', 'coldwell', 'HomeMe', 'הומלנד',
    'נכסים', 'ריאלטי', 'realty', 'קבוצת', 'group', 'אחוזות', 'broker'
  ];
  const blockLower = block.toLowerCase();
  const hasBrokerKeyword = brokerKeywords.some(k => blockLower.includes(k.toLowerCase()));
  
  // In Madlan, broker listings typically end with "תיווך" label or have it in the block
  const endsWithBrokerLabel = /תיווך\s*$/m.test(block) || /תיווך\s*\]/m.test(block);
  
  // Check if "פרטי" appears (private indicator)
  const hasPrivateLabel = /פרטי/.test(block);
  
  // Broker if: has broker label/keyword OR agent image, AND not explicitly private
  const isBroker = (endsWithBrokerLabel || hasBrokerKeyword || hasAgentImage) && !hasPrivateLabel;
  
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
  
  const headerPatterns = [
    /# דירות להשכרה/,
    /# דירות למכירה/,
    /## \d+ דירות להשכרה/,
    /## \d+ דירות למכירה/,
    /דירות להשכרה בתל אביב/,
    /דירות למכירה בתל אביב/,
    /מיינו לפי:/
  ];
  
  for (const pattern of headerPatterns) {
    const match = cleaned.search(pattern);
    if (match > 100) {
      cleaned = cleaned.substring(match);
      break;
    }
  }
  
  const blogPatterns = [
    '## יעניין אותך לדעת',
    '## כתבות שיעניינו אותך',
    '### יעניין אותך',
    '![](https://images2.madlan.co.il/t:nonce:v=2;convert:type=webp/realEstateAgent/office/'
  ];
  
  for (const blogStart of blogPatterns) {
    const blogIdx = cleaned.indexOf(blogStart);
    if (blogIdx > 0) {
      const afterBlog = cleaned.substring(blogIdx);
      const nextListingMatch = afterBlog.search(/\n\[!\[[^\]]+\]\([^\)]+\)\]\(https:\/\/www\.madlan\.co\.il\/(listings|projects)/);
      
      if (nextListingMatch > 0) {
        cleaned = cleaned.substring(0, blogIdx) + afterBlog.substring(nextListingMatch);
      } else {
        cleaned = cleaned.substring(0, blogIdx);
      }
      break;
    }
  }
  
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
