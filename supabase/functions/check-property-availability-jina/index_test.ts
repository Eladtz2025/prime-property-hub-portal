import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  isMadlanBlocked,
  isMadlanHomepage,
  isMadlanSearchResultsPage,
} from "../_shared/availability-indicators.ts";

function detectMadlanOutcome(url: string, content: string): string {
  const isListingUrl = url.includes('/listings/');

  if (isMadlanBlocked(content)) return 'madlan_blocked_retry';
  if (isListingUrl && isMadlanHomepage(content)) return 'listing_removed_homepage_redirect';
  if (isListingUrl && isMadlanSearchResultsPage(content)) return 'listing_removed_search_results_redirect';
  return 'content_ok';
}

Deno.test('detects Madlan captcha/block page as retryable and not content_ok', () => {
  const blockedContent = `
סליחה על ההפרעה...
בזמן שגלשת ב www.madlan.co.il משהו בדפדפן שלך גרם לנו לחשוב שאתה רובוט.
יש מספר סיבות שיכולות לגרום לכך:
השבתת את JavaScript בדפדפן האינטרנט שלך.
אנא השלם את החידה שלפניך לקבלת גישה מיידית למדלן
`;

  assertEquals(isMadlanBlocked(blockedContent), true);
  assertEquals(
    detectMadlanOutcome('https://www.madlan.co.il/listings/FvVdAFNe0nu', blockedContent),
    'madlan_blocked_retry',
  );
});

Deno.test('detects Madlan search-results redirect from listing URL as removed', () => {
  const resultsContent = `
פלורנטין
הכירו את השכונה
מסננים נוספים
שמירת חיפוש
# דירות 2 חדרים למכירה בפלורנטין, תל אביב יפו
## 181 דירות למכירה
מיינו לפי: רלוונטיות
[דירה, אברבנאל 74, פלורנטין](https://www.madlan.co.il/listings/PAnHIUeCgt3)
[דירה, המעון 3, פלורנטין](https://www.madlan.co.il/listings/lctvLWqw9ff)
`;

  assertEquals(isMadlanSearchResultsPage(resultsContent), true);
  assertEquals(isMadlanHomepage(resultsContent), false);
  assertEquals(
    detectMadlanOutcome('https://www.madlan.co.il/listings/FvVdAFNe0nu', resultsContent),
    'listing_removed_search_results_redirect',
  );
});

Deno.test('does not mistake a real Madlan listing page for a redirect', () => {
  const listingContent = `
[חזרה](https://www.madlan.co.il/for-sale/%D7%A9%D7%99%D7%9B%D7%95%D7%9F-%D7%93%D7%9F)
![אשכנזי , שיכון דן, תל אביב יפו](https://images2.madlan.co.il/example.png)
לכל התמונות · 4
‏9,900,000 ₪
6
חדרים
קרקע
קומה
200
מ״ר
`;

  assertEquals(isMadlanBlocked(listingContent), false);
  assertEquals(isMadlanHomepage(listingContent), false);
  assertEquals(isMadlanSearchResultsPage(listingContent), false);
  assertEquals(
    detectMadlanOutcome('https://www.madlan.co.il/listings/FvVdAFNe0nu', listingContent),
    'content_ok',
  );
});

Deno.test('detects Madlan homepage redirect from listing URL as removed', () => {
  const homepageContent = `
ראשי
דירות למכירה
פרויקטים חדשים
חיפושים פופולריים · דירות למכירה
דירות למכירה בתל אביב
חיפושים פופולריים · פרויקטים חדשים
פרויקטים חדשים בתל אביב
`;

  assertEquals(isMadlanHomepage(homepageContent), true);
  assertEquals(
    detectMadlanOutcome('https://www.madlan.co.il/listings/FvVdAFNe0nu', homepageContent),
    'listing_removed_homepage_redirect',
  );
});
