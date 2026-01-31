/**
 * Yad2 Property Parser - Personal Scout Version
 * 
 * ISOLATED COPY - Does not modify production code
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
// Main Entry Point
// ============================================

export function parseYad2Markdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  console.log(`[personal-scout/parser-yad2] Input: ${markdown.length} chars`);
  
  // 1. Clean markdown (skip navigation)
  const cleaned = cleanYad2Content(markdown);
  console.log(`[personal-scout/parser-yad2] After cleaning: ${cleaned.length} chars`);
  
  // 2. Find property blocks
  const blocks = findYad2Blocks(cleaned);
  console.log(`[personal-scout/parser-yad2] Found ${blocks.length} property blocks`);
  
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
  
  console.log(`[personal-scout/parser-yad2] ✅ Parsed ${properties.length} properties (${properties.filter(p => p.is_private).length} private)`);
  
  return {
    success: true,
    properties,
    stats: calculateStats(properties),
    errors
  };
}

// ============================================
// Block Detection
// ============================================

function findYad2Blocks(markdown: string): string[] {
  const blocks: string[] = [];
  
  const listItemPattern = /- \[!\[[^\]]*\]\([^\)]+\)\\[\s\S]*?\]\(https:\/\/www\.yad2\.co\.il\/realestate\/item\/[^\)]+\)/g;
  
  let match;
  while ((match = listItemPattern.exec(markdown)) !== null) {
    const block = match[0];
    
    if (block.includes('/yad1/') || block.includes('/project/')) {
      continue;
    }
    
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
  const urlMatch = block.match(/https:\/\/www\.yad2\.co\.il\/realestate\/item\/([^\?\)]+)/);
  if (!urlMatch) return null;
  
  const sourceId = urlMatch[1];
  const sourceUrl = `https://www.yad2.co.il/realestate/item/${sourceId}`;
  
  const cleanedBlock = block
    .replace(/[\u200F\u200E‎‏]/g, '')
    .replace(/\\{2,}/g, '\\');
  
  const priceMatch = cleanedBlock.match(/₪\s*([\d,]+)/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : null;
  
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
    
    const roomsMatch = details.match(/(\d+(?:\.\d)?)\s*חדרים/);
    if (roomsMatch) {
      rooms = parseFloat(roomsMatch[1]);
    }
    
    const floorMatch = details.match(/קומה\s*(\d+|קרקע)/);
    if (floorMatch) {
      floor = floorMatch[1] === 'קרקע' ? 0 : parseInt(floorMatch[1], 10);
    }
    
    const sizeMatch = details.match(/(\d+)\s*מ[״"']?ר/);
    if (sizeMatch) {
      size = parseInt(sizeMatch[1], 10);
    }
    
    const extractedCity = extractCity(details);
    if (extractedCity) {
      city = extractedCity;
    }
    
    const neighborhoodInfo = extractNeighborhood(details, city);
    if (neighborhoodInfo) {
      neighborhood = neighborhoodInfo.label;
      neighborhoodValue = neighborhoodInfo.value;
    }
    
    const addressPattern = /^([^,]+?)(?:דירה|דירת גן|גג\/פנטהאוז|סטודיו|פנטהאוז)/;
    const addressMatch = details.match(addressPattern);
    if (addressMatch) {
      address = cleanText(addressMatch[1]);
    } else {
      const altMatch = block.match(/\[!\[([^\]]+)\]/);
      if (altMatch && !altMatch[1].includes('פרויקט')) {
        address = cleanText(altMatch[1]);
      }
    }
  }
  
  // Detect broker - check for agency name pattern
  // Broker listings have agency name appearing TWICE before price, e.g.:
  // "בר בן נכסים\\בר בן נכסים₪ 14,000"
  // Private listings go straight to price: "₪ 17,500\\"
  
  // Pattern 1: Agency name repeated twice before price
  const agencyRepeatedPattern = /([א-ת][א-ת\s.'"]+)\\+\s*\1\s*₪/;
  const hasAgencyRepeated = agencyRepeatedPattern.test(cleanedBlock);
  
  // Pattern 2: Line before price contains agency-like name (not an address)
  const linesBeforePrice = cleanedBlock.split('₪')[0];
  const lastLineBeforePrice = linesBeforePrice.split('\\').filter(l => l.trim()).pop() || '';
  const looksLikeAgencyName = /^[א-ת][א-ת\s.'"]+$/.test(lastLineBeforePrice.trim()) 
    && lastLineBeforePrice.trim().length > 3
    && !/\d/.test(lastLineBeforePrice);
  
  // Pattern 3: Known broker keywords
  const hasBrokerKeywords = /תיווך|סוכנות|משרד|נדל"ן|REAL ESTATE|Premium|ניהול נכסים|נכסים/.test(block);
  
  const isBroker = hasAgencyRepeated || (looksLikeAgencyName && lastLineBeforePrice.trim().length > 5) || hasBrokerKeywords || detectBroker(block);
  
  if (!price && !rooms && !address) {
    return null;
  }
  
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
    raw_text: block.substring(0, 500)
  };
}

// ============================================
// Content Cleaning
// ============================================

function cleanYad2Content(markdown: string): string {
  let cleaned = markdown;
  
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
      break;
    }
  }
  
  const yad1Patterns = [
    /## פרויקטים חדשים באזור[\s\S]*?למה כדאי לקנות נכסים יד1/,
    /## פרויקטים חדשים\n[\s\S]*?\[לכל הפרויקטים\]/
  ];
  
  for (const pattern of yad1Patterns) {
    cleaned = cleaned.replace(pattern, '\n');
  }
  
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
