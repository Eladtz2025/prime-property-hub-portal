## התיקון

שינוי יחיד ב-`supabase/functions/backfill-property-data-jina/index.ts` שורות 961-968.

**הבעיה הנוכחית** (אחרי התיקונים הקודמים):
ה-Cheerio fallback מזהה נכון `parking=false` ("ללא"), אבל בלוק ה-merge הקיים שומר על הערך הישן ב-DB:
```ts
if (mergedFeatures[key] === undefined || mergedFeatures[key] === null) {
  mergedFeatures[key] = value;  // רק ממלא חוסרים — לא דורס
}
```
הערך הישן `parking=true` (שגוי, מקורו ב-scout list page) ניצח את `parking=false` החדש האמין מ-detail page.

**התיקון** — לאפשר ל-detail page לדרוס את הערך הישן עבור 17 מפתחות בוליאניים שמגיעים מהסקציה האמינה "מה יש בנכס":

```ts
const AUTHORITATIVE_KEYS = new Set([
  'parking', 'elevator', 'balcony', 'mamad', 'storage',
  'airConditioner', 'renovated', 'furnished', 'accessible',
  'bars', 'sunHeater', 'pets', 'tadiran', 'roof', 'yard',
  'pandorDoors', 'kosherKitchen'
]);
for (const [key, value] of Object.entries(detailResult.features || {})) {
  if (AUTHORITATIVE_KEYS.has(key) && (value === true || value === false)) {
    mergedFeatures[key] = value;  // detail page wins
  } else if (mergedFeatures[key] === undefined || mergedFeatures[key] === null) {
    mergedFeatures[key] = value;  // others: fill gaps only
  }
}
```

## למה זה בטוח
- רק 17 מפתחות בוליאניים מהסקציה האמינה "מה יש בנכס".
- רק `true`/`false` מפורש דורס (לא `undefined`/`null`).
- כל שאר השדות ב-features (כמו `propertyCondition`, `entryDate`, `totalFloors`) לא מושפעים — ה-explicit assignments בשורות 971-977 נשארות כפי שהן.
- אם detail page נכשל לחלוטין → לא נכנסים בכלל לבלוק הזה (`hasFeatures || hasContent` = false).

## בדיקת הצלחה
לאחר שהמשתמש מריץ שוב את ה-Backfill ו-30+ נכסים מתעדכנים:
- `SELECT count(*) FILTER (WHERE features->>'parking'='false')` ייתן מספר חיובי משמעותי (לא רק 'true').
- ה-log `💾 Yad2 final update` יתאים ל-`🔧 Yad2 parking` הקודם.

## חזרה אחורה
מחיקת 11 שורות והחזרת הלולאה הקצרה הקודמת (4 שורות).

## אחרי האימות
המשתמש יבקש לאפס את כ-100 הנכסים שעברו backfill בריצות הקודמות הפגומות (`backfill_status='pending'`) כדי שיעברו מחדש עם הקוד התקין.
