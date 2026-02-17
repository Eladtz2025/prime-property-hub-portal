
# תיקון זיהוי מודעות מוסרות במדלן - Redirect לדף הבית

## הבעיה
מדלן שינתה התנהגות: מודעות שהוסרו **לא מציגות יותר "המודעה הוסרה"** אלא מפנות (redirect) לדף הבית של מדלן. דף הבית מלא בתוכן (300+ שורות), ולכן הבדיקה הנוכחית מסמנת אותו בטעות כ-`content_ok`.

**דוגמה:** מודעה `9jETciWZSNP` (לואי מרשל 10) — הוסרה אבל סומנה כאקטיבית.

## הפתרון

### שינוי 1: הוספת אינדיקטורים לזיהוי דף הבית של מדלן
**קובץ:** `supabase/functions/_shared/availability-indicators.ts`

הוספת פונקציה חדשה `isMadlanHomepage` שמזהה שהתוכן הוא דף הבית ולא מודעה אמיתית. מדלן הומפייג' מכיל תמיד את הטקסט "חיפושים פופולריים · דירות למכירה" ו-"חיפושים פופולריים · דירות להשכרה" — מחרוזות שלא מופיעות בעמוד מודעה רגיל.

```text
// Madlan homepage indicators (redirect = listing removed)
const MADLAN_HOMEPAGE_INDICATORS = [
  'חיפושים פופולריים · דירות למכירה',
  'חיפושים פופולריים · פרויקטים חדשים',
];

export function isMadlanHomepage(content: string): boolean {
  if (!content) return false;
  // If the content contains 2+ homepage indicators, it's the homepage
  let count = 0;
  for (const indicator of MADLAN_HOMEPAGE_INDICATORS) {
    if (content.includes(indicator)) count++;
  }
  return count >= 2;
}
```

### שינוי 2: שימוש בזיהוי החדש ב-Edge Function
**קובץ:** `supabase/functions/check-property-availability/index.ts`

אחרי בדיקת `isListingRemoved`, הוספת בדיקה נוספת לנכסי מדלן: אם התוכן הוא דף הבית של מדלן, הנכס מוסר.

```text
import { isListingRemoved, isMadlanHomepage } from "../_shared/availability-indicators.ts";

// Inside checkWithFirecrawl, after the isListingRemoved check:
if (isListingRemoved(markdown)) {
  return { isInactive: true, reason: 'listing_removed_indicator' };
}

// NEW: Madlan homepage redirect detection
if (source === 'madlan' && isMadlanHomepage(markdown)) {
  console.log(`🚫 Madlan homepage redirect detected for ${url}`);
  return { isInactive: true, reason: 'madlan_homepage_redirect' };
}
```

### שינוי 3: תיקון הנכס הנוכחי
ריצת SQL לתיקון הנכס שכבר סומן בטעות כאקטיבי:

```text
UPDATE scouted_properties 
SET is_active = false, 
    status = 'inactive', 
    availability_check_reason = 'madlan_homepage_redirect',
    availability_checked_at = now()
WHERE id = '064a8633-c064-45e8-9631-51080c6ae516';
```

## פרטים טכניים

### למה 2 אינדיקטורים ולא 1?
דורשים לפחות 2 התאמות כדי למנוע false positive — סביר מאוד שמודעה רגילה לא תכיל את שני הביטויים "חיפושים פופולריים · דירות למכירה" וגם "חיפושים פופולריים · פרויקטים חדשים" באותו עמוד.

### קבצים שמשתנים
1. `supabase/functions/_shared/availability-indicators.ts` — הוספת `isMadlanHomepage`
2. `supabase/functions/check-property-availability/index.ts` — שימוש בפונקציה החדשה
3. SQL migration — תיקון הנכס שכבר סומן בטעות

### השפעה
- כל מודעת מדלן שהוסרה ומפנה לדף הבית תזוהה כלא אקטיבית
- אין השפעה על מודעות אקטיביות (דף מודעה רגיל לא מכיל את הביטויים האלה)
- אין השפעה על יד2 או הומלס
