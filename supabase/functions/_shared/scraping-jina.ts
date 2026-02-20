/**
 * Shared Jina Reader scraping utility
 * Replaces Firecrawl's scrapeWithRetry + getActiveFirecrawlKey
 * Uses GET https://r.jina.ai/{url} with residential proxy
 */

import { validateScrapedContent } from './scraping.ts';

export interface JinaScrapeResult {
  markdown: string;
  html: string;
}

/**
 * Scrape a URL using Jina AI Reader
 * For homeless: returns HTML (for parseHomelessHtml compatibility)
 * For yad2/madlan: returns markdown
 */
export async function scrapeWithJina(
  url: string,
  source: string,
  maxRetries = 3
): Promise<JinaScrapeResult | null> {
  const isHomeless = source === 'homeless';
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const isYad2 = source === 'yad2';
      const fetchTimeout = isYad2 ? 35000 : 45000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

      console.log(`🌐 Jina scrape attempt ${attempt + 1}/${maxRetries} for ${url} (source: ${source}, timeout: ${fetchTimeout/1000}s, free tier)`);

      const headers: Record<string, string> = {
        'X-No-Cache': 'true',
        'X-Wait-For-Selector': 'body',
        'X-Timeout': '30',
        'X-Locale': 'he-IL',
      };

      // Yad2

      // Yad2 is a React SPA - needs longer render timeout but shorter fetch timeout
      if (isYad2) {
        headers['X-Timeout'] = '30';
        headers['X-Wait-For-Selector'] = 'a[href*="/realestate/item/"]';
        headers['X-Proxy-Country'] = 'IL';
      }

      if (isHomeless) {
        // Homeless needs HTML for Cheerio-based parser
        headers['Accept'] = 'text/html';
        headers['X-Return-Format'] = 'html';
      } else {
        // Yad2/Madlan use markdown parsers
        headers['Accept'] = 'text/markdown';
      }

      const response = await fetch(`https://r.jina.ai/${url}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const body = await response.text();
        console.log(`✅ Jina scrape successful for ${url} (${body.length} chars)`);

        if (isHomeless) {
          return { markdown: '', html: body };
        } else {
          return { markdown: body, html: '' };
        }
      }

      const errorText = await response.text();
      console.warn(`⚠️ Jina attempt ${attempt + 1} failed for ${url}, status: ${response.status}, error: ${errorText.substring(0, 200)}`);

      // Wait before retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const waitTime = 3000 * (attempt + 1);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(r => setTimeout(r, waitTime));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏱️ Jina attempt ${attempt + 1} timeout for ${url}`);
      } else {
        console.error(`❌ Jina attempt ${attempt + 1} error for ${url}:`, error);
      }

      if (attempt < maxRetries - 1) {
        const waitTime = 3000 * (attempt + 1);
        await new Promise(r => setTimeout(r, waitTime));
      }
    }
  }

  console.error(`❌ All ${maxRetries} Jina attempts failed for ${url}`);
  return null;
}
