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
    'cf-browser-verification', 'challenge-platform',
    'please wait while we verify', 'checking your browser'
  ];
  
  const lowerContent = ((markdown || '') + (html || '')).toLowerCase();
  for (const indicator of blockIndicators) {
    if (lowerContent.includes(indicator.toLowerCase())) {
      return { valid: false, reason: `Blocked: detected "${indicator}"` };
    }
  }
  
  // Source-specific validation for Madlan
  if (source === 'madlan') {
    const hasListingIndicators = 
      (markdown && (markdown.includes('₪') || markdown.includes('חד\'') || markdown.includes('חדרים'))) ||
      (html && (html.includes('listing') || html.includes('property-card') || html.includes('נכס')));
    
    if (!hasListingIndicators) {
      return { valid: false, reason: 'Madlan page has no property indicators - likely blocked or empty' };
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
 * Scrape with retry mechanism using different user agents
 */
export async function scrapeWithRetry(
  url: string, 
  firecrawlApiKey: string, 
  source: string, 
  maxRetries = 3,
  delayMs?: number
): Promise<any> {
  // Determine wait time based on source
  // Madlan simplified: no complex delays, just quick scrape
  const waitForMs = delayMs || (source === 'yad2' ? 5000 : 3000);
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout (edge functions have 60s limit)

      console.log(`Scrape attempt ${attempt + 1}/${maxRetries} for ${url} (source: ${source}, waitFor: ${waitForMs}ms)`);

      const requestBody: Record<string, unknown> = {
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: waitForMs,
        // Yad2 uses stealth proxy (5 credits), Madlan uses auto (1 credit) - simplified approach works better
        proxy: source === 'yad2' ? 'stealth' : 'auto',
        // Request Israeli proxy for better results on Hebrew sites
        location: {
          country: 'IL',
          languages: ['he']
        },
        headers: {
          'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
          'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        }
      };
      // No special actions for any source - simpler is better

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`Scrape successful for ${url}`);
        return data;
      }

      const errorText = await response.text();
      console.warn(`Attempt ${attempt + 1} failed for ${url}, status: ${response.status}, error: ${errorText}`);

      // Wait before retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const waitTime = 3000 * (attempt + 1);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(r => setTimeout(r, waitTime));
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`Attempt ${attempt + 1} timeout for ${url}`);
      } else {
        console.error(`Attempt ${attempt + 1} error for ${url}:`, error);
      }
      
      if (attempt < maxRetries - 1) {
        const waitTime = 3000 * (attempt + 1);
        await new Promise(r => setTimeout(r, waitTime));
      }
    }
  }

  console.error(`All ${maxRetries} retry attempts failed for ${url}`);
  return null;
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
