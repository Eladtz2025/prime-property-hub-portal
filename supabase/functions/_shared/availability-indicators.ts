/**
 * Shared indicators and helper functions for availability checking
 */

// Indicators that a listing has been removed (Hebrew and English)
// IMPORTANT: These are checked FIRST (Indicator-first approach)
export const LISTING_REMOVED_INDICATORS = [
  // === Yad2 specific ===
  'חיפשנו בכל מקום אבל אין לנו עמוד כזה',
  'העמוד שחיפשת הוסר',
  'הלינק לא תקין',
  'מודעה לא נמצאה',
  'המודעה הוסרה',
  'אין לנו עמוד כזה',
  'חיפשנו בכל מקום',
  'אופס',
  'האתר בשיפוצים',
  
  // === Homeless specific ===
  'נראה שתקלה זו כבר טופלה',
  'טופלה וסגרה',
  'לפניכם חיפושים נוספים',
  'מודעות רלוונטיות',
  'המודעה לא נמצאה',
  'דף הבית של הומלס',
  
  // === Madlan specific ===
  'הנכס לא נמצא',
  'הדירה אינה זמינה',
  'הנכס הוסר',
  'לא נמצאו תוצאות',
  'הנכס כבר נמכר',
  'הנכס כבר הושכר',
  
  // === Hebrew general ===
  'הדף לא נמצא',
  'הנכס אינו זמין',
  'המודעה לא קיימת',
  'הדף המבוקש לא נמצא',
  'לא הצלחנו למצוא',
  
  // === English ===
  'listing not found',
  'item removed',
  'page not found',
  'this listing is no longer available',
  'listing has been removed',
  'no longer exists',
  'no longer available'
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
 * Check if Firecrawl metadata indicates a redirect away from item page
 */
export function isRedirectDetected(
  originalUrl: string, 
  metadata: any, 
  source: string
): { isRedirect: boolean; reason?: string } {
  if (!metadata) return { isRedirect: false };
  
  const finalUrl = metadata.sourceURL || metadata.url || metadata.finalURL;
  if (!finalUrl) return { isRedirect: false };
  
  try {
    const originalPath = new URL(originalUrl).pathname;
    const finalPath = new URL(finalUrl).pathname;
    
    // For Yad2: check if still on /realestate/item/ path
    if (source === 'yad2') {
      const originalHasItem = originalPath.includes('/realestate/item/') || 
                             originalPath.includes('/item/');
      const finalHasItem = finalPath.includes('/realestate/item/') || 
                           finalPath.includes('/item/');
      
      if (originalHasItem && !finalHasItem) {
        console.log(`⚠️ Yad2 redirect detected: ${originalPath} → ${finalPath}`);
        return { isRedirect: true, reason: 'yad2_redirect_to_non_item' };
      }
      
      if (finalPath === '/' || finalPath === '/realestate' || 
          finalPath === '/realestate/') {
        console.log(`⚠️ Yad2 redirect to homepage: ${finalPath}`);
        return { isRedirect: true, reason: 'yad2_redirect_to_homepage' };
      }
    }
    
    // For Madlan
    if (source === 'madlan') {
      const originalHasProperty = originalPath.includes('/property/') || 
                                  originalPath.includes('/listing/');
      const finalHasProperty = finalPath.includes('/property/') || 
                               finalPath.includes('/listing/');
      
      if (originalHasProperty && !finalHasProperty) {
        return { isRedirect: true, reason: 'madlan_redirect_to_non_property' };
      }
    }
  } catch (urlError) {
    console.warn(`URL parsing error for redirect check: ${urlError}`);
  }
  
  return { isRedirect: false };
}

/**
 * Check if content has property indicators (price, rooms, size)
 */
export function hasPropertyIndicators(content: string): boolean {
  return content.includes('₪') || 
         content.includes('חדרים') ||
         content.includes('מ"ר') ||
         content.includes('מטר') ||
         content.includes('קומה');
}
