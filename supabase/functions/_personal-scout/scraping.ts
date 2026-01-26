/**
 * Scraping utilities for Personal Scout
 * 
 * ISOLATED COPY - Does not modify production code
 */

// User agents for retry mechanism
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
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
  
  if (markdownLen < 500 && htmlLen < 1000) {
    return { valid: false, reason: `Content too short (${markdownLen} chars) - likely blocked or empty page` };
  }
  
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
  
  if (source === 'madlan') {
    const hasListingIndicators = 
      (markdown && (markdown.includes('₪') || markdown.includes('חד\'') || markdown.includes('חדרים'))) ||
      (html && (html.includes('listing') || html.includes('property-card') || html.includes('נכס')));
    
    if (!hasListingIndicators) {
      return { valid: false, reason: 'Madlan page has no property indicators - likely blocked or empty' };
    }
  }
  
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
 * EXACT COPY of production logic - proxy: yad2 = stealth, others = auto
 */
export async function scrapeWithRetry(
  url: string, 
  firecrawlApiKey: string, 
  source: string, 
  maxRetries = 3,
  delayMs?: number
): Promise<any> {
  const waitForMs = delayMs || (source === 'yad2' ? 5000 : 3000);
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);

      console.log(`[personal-scout/scraping] Attempt ${attempt + 1}/${maxRetries} for ${url} (source: ${source}, waitFor: ${waitForMs}ms)`);

      const requestBody: Record<string, unknown> = {
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: waitForMs,
        // EXACT proxy logic from production
        proxy: source === 'yad2' ? 'stealth' : 'auto',
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
        console.log(`[personal-scout/scraping] ✅ Scrape successful for ${url}`);
        return data;
      }

      const errorText = await response.text();
      console.warn(`[personal-scout/scraping] Attempt ${attempt + 1} failed for ${url}, status: ${response.status}, error: ${errorText}`);

      if (attempt < maxRetries - 1) {
        const waitTime = 3000 * (attempt + 1);
        console.log(`[personal-scout/scraping] Waiting ${waitTime}ms before retry...`);
        await new Promise(r => setTimeout(r, waitTime));
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`[personal-scout/scraping] Attempt ${attempt + 1} timeout for ${url}`);
      } else {
        console.error(`[personal-scout/scraping] Attempt ${attempt + 1} error for ${url}:`, error);
      }
      
      if (attempt < maxRetries - 1) {
        const waitTime = 3000 * (attempt + 1);
        await new Promise(r => setTimeout(r, waitTime));
      }
    }
  }

  console.error(`[personal-scout/scraping] All ${maxRetries} retry attempts failed for ${url}`);
  return null;
}
