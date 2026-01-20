// Shared scraping utilities for Edge Functions
// Extracted from scout-properties for better maintainability

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// User agents for retry mechanism
export const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
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
  // Determine wait time based on source - Madlan needs longer waits to avoid CAPTCHA
  const waitForMs = delayMs || (source === 'madlan' ? 8000 : 3000);
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout (edge functions have 60s limit)

      console.log(`Scrape attempt ${attempt + 1}/${maxRetries} for ${url} (source: ${source}, waitFor: ${waitForMs}ms)`);

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          waitFor: waitForMs,
          // Use auto proxy (1 credit) - stealth was too expensive and didn't improve results
          proxy: 'auto',
          // Request Israeli proxy for better results on Hebrew sites
          location: {
            country: 'IL',
            languages: ['he']
          },
          headers: {
            'User-Agent': userAgents[attempt % userAgents.length],
            'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cache-Control': 'no-cache',
          }
        }),
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
  if (source === 'madlan') {
    // Look for patterns that indicate property listings start
    const listingPatterns = [
      /דירות להשכרה בתל[-\s]?אביב/,
      /דירות למכירה בתל[-\s]?אביב/,
      /דירות להשכרה/,
      /דירות למכירה/,
      /נמצאו \d+ דירות/,
      /\d+ דירות נמצאו/,
      /₪.*חד[׳']/,  // Price followed by rooms indicator
    ];
    
    for (const pattern of listingPatterns) {
      const match = markdown.search(pattern);
      if (match > 0) {
        // Start from a bit before the match to include context
        return markdown.substring(Math.max(0, match - 100));
      }
    }
  }
  
  if (source === 'homeless') {
    // For homeless, look for property listing indicators
    const listingPatterns = [
      /דירות להשכרה/,
      /דירות למכירה/,
      /\d+ ח[׳'].*\d+ מ"ר/,  // Rooms and size pattern
    ];
    
    for (const pattern of listingPatterns) {
      const match = markdown.search(pattern);
      if (match > 0) {
        return markdown.substring(Math.max(0, match - 100));
      }
    }
  }
  
  return markdown;
}
