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
 * Check if content is Madlan's homepage (redirect from removed listing)
 */
export function isMadlanHomepage(content: string): boolean {
  if (!content) return false;
  let count = 0;
  for (const indicator of MADLAN_HOMEPAGE_INDICATORS) {
    if (content.includes(indicator)) count++;
  }
  return count >= 2;
}
