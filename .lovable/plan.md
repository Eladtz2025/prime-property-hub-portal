# הצמדת בדיקת זמינות לכשלון בהשלמת נתונים

## הבעיה

בריצת ההשלמה הנוכחית, כל ה-`scrape_failed` של Yad2 (ו-Madlan חלקית) הם בעצם **מודעות שהוסרו** — לא כשלון פרסור אמיתי. אימתתי בדפדפן (Yad2 מציג "חיפשנו בכל מקום אבל אין לנו עמוד כזה", Madlan עושה redirect לדף הבית). הנכסים האלה ממשיכים להיות פעילים ב-DB ומופיעים ב-matches.

## הפתרון

במקום לבנות לוגיקת זיהוי הסרה חדשה ב-`yad2-detail-parser`, **לקרוא ל-`check-property-availability-jina` הקיים** ברגע שהשלמת נתונים נכשלת על נכס. הקוד הזה כבר יודע לזהות הסרות גם ב-Yad2 וגם ב-Madlan דרך `_shared/availability-indicators.ts`.

## שינויים

### 1. `supabase/functions/backfill-property-data-jina/index.ts`

הוספת helper יחיד שנקרא בכל מקום שבו `saveRecentItem({ status: 'scrape_failed' })` נשמר:

```ts
async function checkAvailabilityAfterFailure(propertyId: string): Promise<'removed' | 'still_available' | 'check_failed'>
```

- קורא inline ל-`check-property-availability-jina` עם `{ property_ids: [propertyId] }` (timeout 8s)
- אם החזיר `isInactive: true` → הפונקציה כבר עדכנה את ה-DB (סימנה `is_available=false`). מחזיר `'removed'`.
- אם `isInactive: false` → הנכס עדיין חי, הכשלון אמיתי. מחזיר `'still_available'`.
- שגיאה/timeout → `'check_failed'` (ממשיכים כרגיל).

### 2. שילוב ב-3 נקודות הכשלון הקיימות

ב