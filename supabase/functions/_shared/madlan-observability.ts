/**
 * Shared Madlan observability helper.
 * Logs structured info for Madlan scrapes WITHOUT exposing PII.
 */

export type MadlanClassification =
  | 'ok'
  | 'blocked'
  | 'skeleton'
  | 'homepage_redirect'
  | 'removed_indicator'
  | 'captcha'
  | 'empty'
  | 'retryable';

/**
 * Common block / CAPTCHA phrases used across Madlan flows.
 * Hebrew + English generic phrases that signal bot-detection pages.
 */
export const MADLAN_BLOCK_PHRASES = [
  'סליחה על ההפרעה',
  'משהו בדפדפן שלך גרם לנו לחשוב',
  'error 403',
  'access denied',
  'Just a moment',
  'enable JavaScript',
  'Checking your browser',
  'cf-browser-verification',
  'Cloudflare',
  'בקשתך נחסמה',
];

/**
 * Detect if Madlan content is blocked / skeleton / CAPTCHA.
 * Returns a classification string or null if content is OK.
 */
export function classifyMadlanContent(content: string, url: string): MadlanClassification {
  if (!content || content.length < 100) return 'empty';

  const lower = content.toLowerCase();

  // Explicit CAPTCHA / block phrases
  for (const phrase of MADLAN_BLOCK_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      return phrase.includes('סליחה') ? 'captcha' : 'blocked';
    }
  }

  // Homepage redirect detection (reuse existing logic criteria)
  const homepageIndicators = [
    'חיפושים פופולריים · דירות למכירה',
    'חיפושים פופולריים · פרויקטים חדשים',
  ];
  let homepageCount = 0;
  for (const ind of homepageIndicators) {
    if (content.includes(ind)) homepageCount++;
  }
  if (homepageCount >= 2) return 'homepage_redirect';

  // For list pages (/for-rent/, /for-sale/): short content without /listings/ = skeleton
  const isListPage = url.includes('/for-rent/') || url.includes('/for-sale/');
  if (isListPage && content.length < 2000 && !content.includes('/listings/')) {
    return 'skeleton';
  }

  return 'ok';
}

/**
 * Log a structured Madlan scrape result (no PII).
 */
export function logMadlanScrapeResult(
  flow: 'scout' | 'backfill' | 'availability',
  url: string,
  contentLength: number,
  classification: MadlanClassification,
) {
  console.log(JSON.stringify({
    madlan_obs: true,
    flow,
    url,
    content_length: contentLength,
    classification,
    ts: new Date().toISOString(),
  }));
}
