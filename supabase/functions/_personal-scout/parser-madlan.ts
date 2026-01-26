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
  const urlMatch = block.match(/https:\/\/www\.madlan\.co\.il\/(listings|projects)\/([^\)\s\]]+)/);
  if (!urlMatch) return null;
  
  const urlType = urlMatch[1];
  const sourceId = urlMatch[2].replace(/\)$/, '');
  const sourceUrl = `https://www.madlan.co.il/${urlType}/${sourceId}`;
  
  const isCompactBlock = block.includes('\\\\') && block.startsWith('[![');
  
  let parts: string[];
  if (isCompactBlock) {
    parts = block
      .split(/\\\\/)
      .map(p => p.trim())
      .filter(p => p.length > 0 && p !== '\\');
  } else {
    parts = block
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }
  
  const pricePart = parts.find(p => p.includes('₪'));
  const price = pricePart ? extractPrice(pricePart) : null;
  
  const roomsPart = parts.find(p => /\d+\.?\d*\s*חד[׳'ר]/.test(p));
  const rooms = roomsPart ? extractRooms(roomsPart) : null;
  
  const floorPart = parts.find(p => /קומה/.test(p));
  const floor = floorPart ? extractFloor(floorPart) : null;
  
  const sizePart = parts.find(p => /\d+\s*מ"ר|\d+\s*מ״ר/.test(p));
  const size = sizePart ? extractSize(sizePart) : null;
  
  let address: string | null = null;
  let neighborhood: string | null = null;
  let neighborhoodValue: string | null = null;
  const city = 'תל אביב יפו';
  
  for (const part of parts) {
    const typePattern = /^(דירה|דירת גג|פנטהאוז|סטודיו|גן|קוטג'?|בית פרטי)/;
    if (typePattern.test(part)) {
      const segments = part.split(',').map(s => s.trim());
      if (segments.length >= 2) {
        address = cleanText(segments[1]);
      }
      if (segments.length >= 3) {
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
  
  const isProject = block.includes('/projects/') || block.includes('פרויקט');
  if (!price && !rooms && !address && !size && !isProject) return null;
  
  const hasAgentImage = block.includes('[![](https://') && (block.includes('/agents/') || block.includes('/developers/'));
  const hasBrokerKeyword = /תיווך|בבלעדיות|מתווך/.test(block);
  const isProjectDeveloper = isProject;
  const isBroker = hasBrokerKeyword || hasAgentImage || isProjectDeveloper || detectBroker(block);
  
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
