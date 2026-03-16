/**
 * Shared indicators for availability checking
 * ONLY exact strings that appear on real removal pages per site
 */

// Yad2 removal page strings
const YAD2_REMOVAL_INDICATORS = [
  'חיפשנו בכל מקום אבל אין לנו עמוד כזה',
  'העמוד שחיפשת הוסר',
];

// Madlan removal page strings
const MADLAN_REMOVAL_INDICATORS = [
  'המודעה הוסרה',
];

// Homeless removal page strings
const HOMELESS_REMOVAL_INDICATORS = [
  'נראה שעסקה זו כבר נסגרה',
];

export const LISTING_REMOVED_INDICATORS = [
  ...YAD2_REMOVAL_INDICATORS,
  ...MADLAN_REMOVAL_INDICATORS,
  ...HOMELESS_REMOVAL_INDICATORS,
];

// Madlan homepage indicators (redirect = listing removed)
const MADLAN_HOMEPAGE_INDICATORS = [
  'חיפושים פופולריים · דירות למכירה',
  'חיפושים פופולריים · פרויקטים חדשים',
];

const MADLAN_BLOCK_INDICATORS = [
  'סליחה על ההפרעה',
  'משהו בדפדפן שלך גרם לנו לחשוב שאתה רובוט',
  'אנא השלם את החידה שלפניך לקבלת גישה מיידית למדלן',
  'Checking your browser',
  'enable JavaScript',
  'Cloudflare',
  'Access denied',
  'error 403',
];

const MADLAN_SEARCH_RESULTS_INDICATORS = [
  'מיינו לפי: רלוונטיות',
  'מסננים נוספים',
  'שמירת חיפוש',
];

const MADLAN_AREA_PAGE_INDICATORS = [
  'הכירו את העיר',
  'הכירו את השכונה',
];

function hasMadlanListingSpecificContent(content: string): boolean {
  if (!content) return false;

  const listingIndicators = [
    'דירה להשכרה:',
    'דירה למכירה:',
    'דירת גן להשכרה:',
    'דירת גן למכירה:',
    'פנטהאוז להשכרה:',
    'פנטהאוז למכירה:',
    'בית פרטי להשכרה:',
    'בית פרטי למכירה:',
    'דו משפחתי',
    'משרד להשכרה:',
    'משרד למכירה:',
    'לכל התמונות',
  ];

  return listingIndicators.some((indicator) => content.includes(indicator));
}

/**
 * Check if content indicates the listing was removed
 */
export function isListingRemoved(content: string): boolean {
  if (!content) return false;
  
  const lowerContent = content.toLowerCase();
  
  for (const indicator of LISTING_REMOVED_INDICATORS) {
    if (lowerContent.includes(indicator.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if Madlan returned a bot-block / captcha page.
 */
export function isMadlanBlocked(content: string): boolean {
  if (!content) return false;

  const lowerContent = content.toLowerCase();

  for (const indicator of MADLAN_BLOCK_INDICATORS) {
    if (lowerContent.includes(indicator.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Check if content is Madlan's homepage (redirect from removed listing)
 * Must match homepage indicators AND NOT contain listing-specific content
 */
export function isMadlanHomepage(content: string): boolean {
  if (!content || hasMadlanListingSpecificContent(content)) return false;
  
  let count = 0;
  for (const indicator of MADLAN_HOMEPAGE_INDICATORS) {
    if (content.includes(indicator)) count++;
  }
  return count >= 2;
}

/**
 * Check if content is a Madlan search-results page.
 * This usually means a removed listing redirected to a generic area/filter results page.
 */
export function isMadlanSearchResultsPage(content: string): boolean {
  if (!content || hasMadlanListingSpecificContent(content)) return false;

  const hasResultsHeading =
    /(^|\n)#\s*דירות[^\n#]{0,120}(למכירה|להשכרה)/m.test(content) ||
    /(^|\n)##\s*\d+\s+דירות\s+(למכירה|להשכרה)/m.test(content);

  const resultsIndicatorCount = MADLAN_SEARCH_RESULTS_INDICATORS.filter((indicator) =>
    content.includes(indicator)
  ).length;

  const hasAreaIntro = MADLAN_AREA_PAGE_INDICATORS.some((indicator) =>
    content.includes(indicator)
  );

  const listingsLinksCount = (content.match(/https:\/\/www\.madlan\.co\.il\/listings\//g) || []).length;

  return hasResultsHeading && resultsIndicatorCount >= 2 && (hasAreaIntro || listingsLinksCount >= 2);
}
