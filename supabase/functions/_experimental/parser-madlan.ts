/**
 * Madlan Property Parser
 * 
 * EXPERIMENTAL - Completely isolated from production code
 * Parses property listings from Madlan HTML/Markdown content
 * 
 * PARSING PRIORITY:
 * 1. JSON extraction from __SSR_HYDRATED_CONTEXT__ (most reliable - structured data)
 * 2. HTML DOM parsing with cheerio (fallback)
 * 3. Markdown/text regex parsing (last resort)
 */

import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';
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
// Madlan JSON Parser (PREFERRED METHOD)
// ============================================

/**
 * Parse Madlan from embedded SSR JSON (MOST RELIABLE)
 * Madlan embeds all property data as pre-parsed JSON in window.__SSR_HYDRATED_CONTEXT__
 * This is the gold standard for accuracy.
 */
export function parseMadlanJson(
  html: string, 
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  // Extract JSON from SSR context - handle various script patterns
  const jsonMatch = html.match(/window\.__SSR_HYDRATED_CONTEXT__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/);
  
  if (!jsonMatch) {
    console.log('[parser-madlan-json] No __SSR_HYDRATED_CONTEXT__ found in HTML');
    return { success: false, properties: [], stats: null, errors: ['No SSR context found'] };
  }
  
  try {
    const ssrContext = JSON.parse(jsonMatch[1]);
    
    // Navigate to the POI list
    const poiList = ssrContext?.reduxInitialState?.domainData?.searchList?.data?.searchPoiV2?.poi;
    
    if (!poiList || !Array.isArray(poiList)) {
      console.log('[parser-madlan-json] No POI list found in SSR context');
      return { success: false, properties: [], stats: null, errors: ['No POI list in SSR data'] };
    }
    
    console.log(`[parser-madlan-json] ✅ Found ${poiList.length} properties in SSR JSON data`);
    
    for (let i = 0; i < poiList.length; i++) {
      const poi = poiList[i];
      
      // Skip non-bulletins (projects, ads, etc.)
      if (poi.type !== 'bulletin') {
        console.log(`[parser-madlan-json] Skipping non-bulletin type: ${poi.type}`);
        continue;
      }
      
      // Extract floor (comes as string like "1", "17", "-1")
      let floor: number | null = null;
      if (poi.floor !== undefined && poi.floor !== null) {
        const floorStr = String(poi.floor);
        floor = parseInt(floorStr, 10);
        if (isNaN(floor)) floor = null;
      }
      
      // Determine if private or broker
      const isPrivate = poi.poc?.type === 'private';
      
      // Build source URL
      const sourceUrl = poi.id ? `https://www.madlan.co.il/listings/${poi.id}` : '';
      
      // Get neighborhood (prefer Hebrew display value)
      const neighborhood = poi.addressDetails?.neighbourhood || null;
      const neighborhoodDocId = poi.addressDetails?.neighbourhoodDocId || null;
      
      // Build property object
      const property: ParsedProperty = {
        source: 'madlan',
        source_id: `madlan_${poi.id}`,
        source_url: sourceUrl,
        title: buildTitle(propertyType, poi.beds || null, neighborhood || poi.addressDetails?.city || 'תל אביב יפו'),
        city: poi.addressDetails?.city || 'תל אביב יפו',
        neighborhood: neighborhood,
        neighborhood_value: neighborhoodDocId,
        address: poi.address || null,
        price: poi.price || null,
        rooms: poi.beds || null,
        size: poi.area || null,
        floor: floor,
        property_type: propertyType,
        is_private: isPrivate,
        entry_date: poi.firstTimeSeen ? poi.firstTimeSeen.split('T')[0] : null,
        raw_text: JSON.stringify({
          id: poi.id,
          address: poi.address,
          price: poi.price,
          beds: poi.beds,
          area: poi.area,
          floor: poi.floor,
          poc: poi.poc?.type,
          neighbourhood: neighborhood
        }).substring(0, 500)
      };
      
      properties.push(property);
    }
    
    console.log(`[parser-madlan-json] ✅ Successfully parsed ${properties.length} bulletins from JSON`);
    
    return {
      success: true,
      properties,
      stats: calculateStats(properties),
      errors
    };
    
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error(`[parser-madlan-json] JSON parse error: ${errorMsg}`);
    errors.push(`JSON parse error: ${errorMsg}`);
    return { success: false, properties: [], stats: null, errors };
  }
}

// ============================================
// Madlan HTML Parser (FALLBACK)
// ============================================

/**
 * Parse Madlan property listings from HTML content
 * PRIORITY: Tries JSON first, then DOM, then text
 */
export function parseMadlanHtml(
  html: string, 
  propertyType: 'rent' | 'sale'
): ParserResult {
  // PRIORITY 1: Try JSON extraction (most reliable)
  if (html.includes('__SSR_HYDRATED_CONTEXT__')) {
    console.log('[parser-madlan] Attempting JSON extraction (preferred method)...');
    const jsonResult = parseMadlanJson(html, propertyType);
    if (jsonResult.success && jsonResult.properties.length > 0) {
      console.log(`[parser-madlan] ✅ JSON extraction successful: ${jsonResult.properties.length} properties`);
      return jsonResult;
    }
    console.log('[parser-madlan] JSON extraction failed, falling back to DOM parsing');
  }
  
  // PRIORITY 2: Try DOM parsing with cheerio
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  const $ = cheerio.load(html);
  
  // Madlan uses various card structures
  const propertyCards = $('[data-auto="property-card"], [class*="PropertyCard"], [class*="property-card"], [class*="listing-card"]');
  
  console.log(`[parser-madlan] Found ${propertyCards.length} property cards in DOM`);
  
  // If no cards found, try text extraction
  if (propertyCards.length === 0) {
    const allText = $.text();
    const hasContent = allText.includes('₪') || 
                       allText.includes('חדרים') || 
                       allText.includes('חד׳') ||
                       allText.includes('חד\'') ||
                       /\d+[‏\s]*₪/.test(allText) ||
                       /₪[‏\s]*\d+/.test(allText);
    
    if (hasContent) {
      console.log('[parser-madlan] No DOM cards found, falling back to markdown parsing');
      return parseMadlanMarkdown(allText, propertyType);
    }
  }
  
  propertyCards.each((i, el) => {
    try {
      const card = $(el);
      const fullText = card.text();
      
      const priceText = card.find('[class*="price"], [class*="Price"]').first().text();
      const price = extractPrice(priceText) || extractPrice(fullText);
      
      const addressText = card.find('[class*="address"], [class*="Address"], [class*="location"]').first().text();
      const address = cleanText(addressText);
      
      const city = extractCity(address) || extractCity(fullText) || 'תל אביב יפו';
      const neighborhood = extractNeighborhood(address, city) || extractNeighborhood(fullText, city);
      
      const rooms = extractRooms(fullText);
      const size = extractSize(fullText);
      const floor = extractFloor(fullText);
      
      const linkHref = card.find('a[href*="/item/"], a[href*="/nadlan/"]').first().attr('href') || '';
      const sourceUrl = linkHref.startsWith('http') ? linkHref : (linkHref ? `https://www.madlan.co.il${linkHref}` : '');
      
      const isBroker = detectBroker(fullText);
      const title = buildTitle(propertyType, rooms, neighborhood?.label || city);
      
      if (!price && !rooms && !address) {
        errors.push(`Card ${i}: No meaningful data extracted`);
        return;
      }
      
      properties.push({
        source: 'madlan',
        source_id: generateSourceId('madlan', sourceUrl || fullText, i),
        source_url: sourceUrl,
        title,
        city,
        neighborhood: neighborhood?.label || null,
        neighborhood_value: neighborhood?.value || null,
        address: address || null,
        price,
        rooms,
        size,
        floor,
        property_type: propertyType,
        is_private: !isBroker,
        entry_date: null,
        raw_text: fullText.substring(0, 500)
      });
      
    } catch (error) {
      errors.push(`Card ${i}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  return {
    success: true,
    properties,
    stats: calculateStats(properties),
    errors
  };
}

// ============================================
// Madlan Markdown Parser
// ============================================

// ============================================
// Content Cleaning (mirrors _shared/scraping.ts)
// ============================================

/**
 * Clean Madlan markdown content before parsing
 * Replicates the production AI preprocessing logic
 */
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
      console.log(`[Madlan Clean] Skipped ${match} chars of navigation`);
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
      console.log(`[Madlan Clean] Removed blog section at position ${blogStart}`);
      cleaned = cleaned.substring(0, blogStart) + afterBlog.substring(nextPropertyMatch.index);
    } else {
      // No more properties after blog, just cut it
      cleaned = cleaned.substring(0, blogStart);
    }
  }
  
  // 3. Remove footer
  const footerPatterns = [/\[דף הבית\]/, /מידע חשוב/, /דירות לפי מספר חדרים/];
  for (const pattern of footerPatterns) {
    const footerStart = cleaned.search(pattern);
    if (footerStart > 0) {
      console.log(`[Madlan Clean] Removed footer at position ${footerStart}`);
      cleaned = cleaned.substring(0, footerStart);
      break;
    }
  }
  
  // 4. Remove image URLs (saves ~40% of content)
  cleaned = cleaned.replace(/https:\/\/images2\.madlan\.co\.il\/[^\s\)\]]+/g, '[IMG]');
  cleaned = cleaned.replace(/https:\/\/s3-eu-west-1\.amazonaws\.com\/media\.madlan\.co\.il\/[^\s\)\]]+/g, '[IMG]');
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^\)]*\)/g, '[IMG]'); // Generic markdown images
  
  console.log(`[Madlan Clean] ${originalLength} → ${cleaned.length} chars (${Math.round((1 - cleaned.length/originalLength) * 100)}% reduction)`);
  
  return cleaned;
}

// ============================================
// Madlan Markdown Parser
// ============================================

/**
 * Parse Madlan property listings from Markdown/text content
 * 
 * Madlan markdown patterns:
 * - Price: "X,XXX ₪" or "₪ X,XXX" or RTL "[‏4,500‏₪]"
 * - Rooms: "X חד׳" or "X חדרים" or "3 חד׳"
 * - Size: "X מ"ר" or "X מ״ר"
 * - Floor: "קומה X"
 * - Address: "רחוב, שכונה, עיר"
 */
export function parseMadlanMarkdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  const properties: ParsedProperty[] = [];
  const errors: string[] = [];
  
  // Clean content before parsing (mirrors production AI preprocessing)
  const cleanedMarkdown = cleanMadlanContent(markdown);
  
  // Debug: Log input sample
  console.log(`[parser-madlan] Original: ${markdown.length} → Cleaned: ${cleanedMarkdown.length} chars`);
  console.log(`[parser-madlan] Sample (first 300): ${cleanedMarkdown.substring(0, 300).replace(/\n/g, '\\n')}`);
  
  // Split by lines (use cleaned content)
  const lines = cleanedMarkdown.split('\n');
  
  // RTL-aware patterns for Madlan
  // Handles: "₪4,500", "4,500₪", "[‏4,500‏₪]", "4,500 ₪"
  const pricePattern = /[\[‏]*([\d,]+)[‏\s]*₪[\]‏]*|₪[‏\s]*([\d,]+)/;
  // Handles: "3 חד׳", "3.5 חדרים", "3חד'"
  const roomsPattern = /(\d+(?:[.,]\d)?)\s*(?:חד[׳']|חדרים)/;
  
  // Debug: Test patterns on cleaned text
  const fullText = cleanedMarkdown;
  const priceMatches = fullText.match(new RegExp(pricePattern.source, 'g'));
  const roomsMatches = fullText.match(new RegExp(roomsPattern.source, 'g'));
  console.log(`[parser-madlan] Price patterns found: ${priceMatches?.length || 0}`, priceMatches?.slice(0, 5));
  console.log(`[parser-madlan] Rooms patterns found: ${roomsMatches?.length || 0}`, roomsMatches?.slice(0, 5));
  
  let currentProperty: Partial<ParsedProperty> | null = null;
  let currentRawText = '';
  let linesSincePrice = 0;
  
  for (const line of lines) {
    const cleanLine = cleanText(line);
    if (!cleanLine || cleanLine.length < 3) continue;
    
    // Check if this line has a price (potential new listing)
    const hasPrice = pricePattern.test(cleanLine);
    const hasRooms = roomsPattern.test(cleanLine);
    
    // New listing detection: price or rooms+address pattern
    if (hasPrice || (hasRooms && linesSincePrice > 5)) {
      // Save previous property if exists
      if (currentProperty && (currentProperty.price || currentProperty.rooms)) {
        properties.push(finalizeProperty(currentProperty, currentRawText, propertyType, properties.length));
      }
      
      // Start new property
      currentProperty = {
        price: extractPrice(cleanLine),
        rooms: extractRooms(cleanLine),
        size: extractSize(cleanLine),
        floor: extractFloor(cleanLine),
        city: extractCity(cleanLine),
        is_private: !detectBroker(cleanLine)
      };
      
      // Try to extract neighborhood
      const neighborhood = extractNeighborhood(cleanLine, currentProperty.city || null);
      if (neighborhood) {
        currentProperty.neighborhood = neighborhood.label;
        currentProperty.neighborhood_value = neighborhood.value;
      }
      
      // Extract address from bold patterns like **[Address]**
      const boldMatch = cleanLine.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        currentProperty.address = boldMatch[1].trim();
      }
      
      currentRawText = cleanLine;
      linesSincePrice = 0;
      
    } else if (currentProperty) {
      // Add to current property
      currentRawText += ' ' + cleanLine;
      linesSincePrice++;
      
      // Try to extract missing fields
      if (!currentProperty.rooms) currentProperty.rooms = extractRooms(cleanLine);
      if (!currentProperty.size) currentProperty.size = extractSize(cleanLine);
      if (!currentProperty.floor) {
        const floorResult = extractFloor(cleanLine);
        if (floorResult !== null) {
          console.log(`[parser-madlan] Floor extracted: ${floorResult} from: "${cleanLine.substring(0, 50)}"`);
        }
        currentProperty.floor = floorResult;
      }
      if (!currentProperty.city) currentProperty.city = extractCity(cleanLine);
      
      if (!currentProperty.neighborhood) {
        const neighborhood = extractNeighborhood(cleanLine, currentProperty.city || null);
        if (neighborhood) {
          currentProperty.neighborhood = neighborhood.label;
          currentProperty.neighborhood_value = neighborhood.value;
        }
      }
      
      // Extract address from bold text
      if (!currentProperty.address) {
        const boldMatch = cleanLine.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
          currentProperty.address = boldMatch[1].trim();
        }
      }
      
      // Broker detection
      if (currentProperty.is_private !== false && detectBroker(cleanLine)) {
        currentProperty.is_private = false;
      }
    } else {
      linesSincePrice++;
    }
  }
  
  // Don't forget last property
  if (currentProperty && (currentProperty.price || currentProperty.rooms)) {
    properties.push(finalizeProperty(currentProperty, currentRawText, propertyType, properties.length));
  }
  
  return {
    success: true,
    properties,
    stats: calculateStats(properties),
    errors
  };
}

// ============================================
// Helper Functions
// ============================================

function finalizeProperty(
  partial: Partial<ParsedProperty>,
  rawText: string,
  propertyType: 'rent' | 'sale',
  index: number
): ParsedProperty {
  const city = partial.city || 'תל אביב יפו';
  const title = buildTitle(propertyType, partial.rooms || null, partial.neighborhood || city);
  
  return {
    source: 'madlan',
    source_id: generateSourceId('madlan', rawText, index),
    source_url: '',
    title,
    city,
    neighborhood: partial.neighborhood || null,
    neighborhood_value: partial.neighborhood_value || null,
    address: partial.address || null,
    price: partial.price || null,
    rooms: partial.rooms || null,
    size: partial.size || null,
    floor: partial.floor || null,
    property_type: propertyType,
    is_private: partial.is_private ?? true,
    entry_date: null,
    raw_text: rawText.substring(0, 500)
  };
}

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
