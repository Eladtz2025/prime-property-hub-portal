// Shared scraping utilities for Edge Functions
// Extracted from scout-properties for better maintainability

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// User agents for retry mechanism - expanded list for better rotation
export const userAgents = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  // Safari on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  // Chrome on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // Firefox
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  // Edge
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  // Chrome on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

/**
 * Validate scraped content - detect empty pages, CAPTCHAs, and blocking
 */
export function validateScrapedContent(
  markdown: string | undefined, 
  html: string | undefined, 
  source: string
): { valid: boolean; reason?: string } {
  const markdownLen = markdown?.length || 0;
  const htmlLen = html?.length || 0;
  
  // Check minimum content length
  if (markdownLen < 500 && htmlLen < 1000) {
    return { valid: false, reason: `Content too short (${markdownLen} chars) - likely blocked or empty page` };
  }
  
  // Check for CAPTCHA/blocking indicators
  const blockIndicators = [
    'captcha', 'אנחנו צריכים לוודא', 'verify you are human',
    'blocked', 'access denied', 'בקשתך נחסמה',
    'too many requests', 'יותר מדי בקשות', 'rate limit',
    'cf-browser-verification',
    'please wait while we verify', 'checking your browser'
  ];
  
  // "challenge-platform" is a Cloudflare script present on many pages even when content loads fine.
  // Only treat it as blocking if there's NO real property content alongside it.
  const softBlockIndicators = ['challenge-platform'];
  
  const lowerContent = ((markdown || '') + (html || '')).toLowerCase();
  for (const indicator of blockIndicators) {
    if (lowerContent.includes(indicator.toLowerCase())) {
      return { valid: false, reason: `Blocked: detected "${indicator}"` };
    }
  }
  
  // For soft indicators, check if real content exists alongside them
  for (const indicator of softBlockIndicators) {
    if (lowerContent.includes(indicator.toLowerCase())) {
      // Check if there's actual property content (prices, room counts, listing data)
      const hasRealContent = lowerContent.includes('₪') || 
        lowerContent.includes('חדרים') || 
        lowerContent.includes('חד\'') ||
        (html && (html.includes('<table') || html.includes('tbl_content') || html.includes('listing')));
      
      if (!hasRealContent) {
        return { valid: false, reason: `Blocked: detected "${indicator}" with no property content` };
      }
      // If real content exists, it's just a Cloudflare tag on a valid page — continue
      console.log(`Note: "${indicator}" detected but page has real property content — proceeding`);
    }
  }
  
  // Source-specific validation for Madlan
  if (source === 'madlan') {
    // For list pages (/for-rent/, /for-sale/): require /listings/ links
    const content = markdown || html || '';
    const isListPage = content.includes('/for-rent/') || content.includes('/for-sale/') ||
      // Also detect list pages by checking if URL was passed via marker in content
      // Fallback: if no /listings/ and no price indicators, it's suspicious
      false;
    
    const hasListingLinks = content.includes('/listings/');
    const hasPriceIndicators = 
      (markdown && (markdown.includes('₪') || markdown.includes('חד\'') || markdown.includes('חדרים'))) ||
      (html && (html.includes('listing') || html.includes('property-card') || html.includes('נכס')));
    
    if (hasListingLinks) {
      // List page with listing links — valid
    } else if (hasPriceIndicators) {
      // Single listing page with price/rooms — valid (backfill/availability pages)
    } else {
      return { valid: false, reason: 'Madlan page has no /listings/ links or property indicators - likely blocked or skeleton' };
    }
  }
  
  // Source-specific validation for Yad2
  if (source === 'yad2') {
    const hasListingIndicators = 
      (markdown && (markdown.includes('₪') || markdown.includes('חד\'') || markdown.includes('חדרים'))) ||
      (html && (html.includes('feeditem') || html.includes('feed_item')));
    
    if (!hasListingIndicators) {
      return { valid: false, reason: 'Yad2 page has no property indicators - likely blocked or empty' };
    }
  }
  
  return { valid: true };
}


/**
 * Clean markdown content to remove navigation and focus on property listings
 */
export function cleanMarkdownContent(markdown: string, source: string): string {
  let cleaned = markdown;
  
  // ==================== Homeless Smart Extraction ====================
  if (source === 'homeless') {
    // Properties start after "כרגע בלוח דירות להשכרה" or "כרגע בלוח דירות למכירה"
    const rentStart = cleaned.indexOf('כרגע בלוח דירות להשכרה');
    const saleStart = cleaned.indexOf('כרגע בלוח דירות למכירה');
    const contentStart = Math.max(rentStart, saleStart);
    
    if (contentStart > 0) {
      const skipped = contentStart;
      cleaned = cleaned.substring(contentStart);
      console.log(`[Homeless Clean] Skipped ${skipped} chars of header/navigation`);
    }
    
    // Properties end before pagination "< הקודם" or "הבא >"
    const prevPattern = cleaned.indexOf('< הקודם');
    const nextPattern = cleaned.indexOf('הבא >');
    const contentEnd = prevPattern > 0 ? prevPattern : (nextPattern > 0 ? nextPattern : -1);
    
    if (contentEnd > 0) {
      const trimmed = cleaned.length - contentEnd;
      cleaned = cleaned.substring(0, contentEnd);
      console.log(`[Homeless Clean] Trimmed ${trimmed} chars of footer/pagination`);
    }
    
    return cleaned;
  }
  
  // ==================== Madlan Smart Extraction ====================
  if (source === 'madlan') {
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
    
    // 2. Remove blog section "יעניין אותך לדעת..." that appears mid-page
    const blogStart = cleaned.indexOf('## יעניין אותך לדעת');
    if (blogStart > 0) {
      const afterBlog = cleaned.substring(blogStart);
      // Find next property listing after blog section (starts with price ₪)
      const nextPropertyMatch = afterBlog.match(/\[‏[\d,]+\s*‏₪/);
      if (nextPropertyMatch?.index) {
        const removedChars = nextPropertyMatch.index;
        cleaned = cleaned.substring(0, blogStart) + afterBlog.substring(nextPropertyMatch.index);
        console.log(`[Madlan Clean] Removed ~${removedChars} chars of blog section`);
      }
    }
    
    // 3. Remove footer - pagination and links
    const footerPatterns = [
      /\[דף הבית\]/,
      /מידע חשוב/,
      /דירות לפי מספר חדרים/,
    ];
    
    for (const pattern of footerPatterns) {
      const footerStart = cleaned.search(pattern);
      if (footerStart > 0) {
        console.log(`[Madlan Clean] Trimmed ${cleaned.length - footerStart} chars of footer`);
        cleaned = cleaned.substring(0, footerStart);
        break;
      }
    }
    
    // 4. Remove long image URLs (saves ~40% of characters)
    const beforeUrlClean = cleaned.length;
    cleaned = cleaned.replace(/https:\/\/images2\.madlan\.co\.il\/[^\s\)\]]+/g, '[IMG]');
    cleaned = cleaned.replace(/https:\/\/s3-eu-west-1\.amazonaws\.com\/media\.madlan\.co\.il\/[^\s\)\]]+/g, '[IMG]');
    const urlSaved = beforeUrlClean - cleaned.length;
    if (urlSaved > 0) {
      console.log(`[Madlan Clean] Removed ${urlSaved} chars of image URLs`);
    }
    
    return cleaned;
  }
  
  // ==================== Homeless Legacy (kept for reference) ====================
  // Note: Homeless now uses smart extraction above
  
  // ==================== Yad2 Smart Extraction ====================
  if (source === 'yad2') {
    // For Yad2, skip headers/filters and start from listing area
    // This saves ~5,000 chars of irrelevant content, making room for more private listings
    const listingPatterns = [
      /נדל"ן לה(שכרה|מכירה) ב/,     // "נדל"ן להשכרה בתל אביב"
      /\d+[\s,]*תוצאות/,              // "1,315 תוצאות"
      /מיון לפי/,                      // Sort header
      /מודעות פרטיות/,                 // Private listings section
    ];
    
    for (const pattern of listingPatterns) {
      const match = cleaned.search(pattern);
      if (match > 0) {
        console.log(`[Yad2 Clean] Found pattern at position ${match}, skipping ${match} chars of headers`);
        cleaned = cleaned.substring(match);
        break;
      }
    }
    
    return cleaned;
  }
  
  return cleaned;
}
