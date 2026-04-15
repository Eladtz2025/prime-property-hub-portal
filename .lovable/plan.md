

# בדיקה מעמיקה — מדל"ן ויד2: ממצאים ותוכנית

## מה מצאתי

### מדל"ן — תגלית משמעותית: GraphQL API פתוח
מדל"ן משתמש ב-API פנימי (GraphQL) בכתובת `https://www.madlan.co.il/api2` שמחזיר **נתונים מובנים** לכל נכס.

הפעולה `poiByIds` מקבלת ID של נכס ומחזירה אובייקט `amenities` מלא:

```text
amenities {
  accessible      → נגישות
  airConditioner  → מיזוג
  balcony         → מרפסת
  elevator        → מעלית
  furnished       → ריהוט
  garage          → חניה
  garden          → גינה
  grating         → סורגים
  parking         → חניה
  pool            → בריכה
  secureRoom      → ממ"ד
  storage         → מחסן
  ...ועוד ~25 שדות
}
```

**בלי Jina, בלי headless browser, בלי עלות** — POST רגיל עם JSON.

Headers הנדרשים (מתוך הנתונים שאספתי):
- `X-Source: web`
- `X-Requested-With: XMLHttpRequest`
- `X-Original-Hostname: www.madlan.co.il`
- `content-type: application/json`

### יד2 — מוגבל אבל אפשר לשפר
דפי נכסים בודדים ביד2 **נחסמים ע"י WAF** בבקשות שרת. גם Jina לא תמיד מצליח.

**אבל:** ה-SERP (דפי חיפוש) של יד2 שאנחנו כבר סורקים מכילים מידע על פיצ'רים. הבעיה — הפארסר הנוכחי (`parser-yad2.ts`) לא מחלץ את כל הפיצ'רים הזמינים. הפיצ'רים שכן מופיעים ב-SERP: חניה, מעלית, ממ"ד, מרפסת (כתגיות).

### נתוני איכות נוכחיים (מה-DB)

```text
מקור     | pending | % עם features | % עם size | % עם floor
---------|---------|---------------|-----------|------------
הומלס    |   346   |     48%       |    17%    |    99%
מדל"ן    | 1,117   |     64%       |   100%    |    95%
יד2      | 2,220   |     82%       |   100%    |   100%
```

פירוט features שקיימים (רק מי שיש לו features):
```text
           balcony  elevator  parking  mamad  renovated  pets  furnished
הומלס       100%     100%     100%    95%      0%       95%     0%
מדל"ן        98%      98%      98%    92%      6%       92%     4%
יד2          48%      79%      87%    34%     84%       14%    31%
```

## תוכנית מוצעת

### שלב 1 — מדל"ן: parser חדש מבוסס GraphQL API (חינמי, ללא שינוי בסורק)

**קובץ חדש:** `supabase/functions/_shared/madlan-detail-parser.ts`

יעשה POST ל-`/api2` עם GraphQL query `poiByIds` ויחלץ:
- כל 25+ פיצ'רים מ-`amenities` (boolean מובנה, לא ניחוש)
- `area` (גודל), `floor`/`floors`, `beds` (חדרים)
- `generalCondition` (משופצת/חדשה)
- `furnitureDetails` (ריהוט)
- `poc.type` (private/agent — סיווג מדויק)

**שילוב:** 
- בקפיל (`backfill-property-data-jina`) — במקום Jina ל-madlan
- אפשרות: גם בסורק (`scout-madlan-jina`) לנכסים חדשים

### שלב 2 — יד2: שיפור חילוץ מ-SERP (ללא גישה לדף נכס)

**עדכון:** `parser-yad2.ts` — חילוץ נוסף של תגיות פיצ'רים מבלוקי ה-SERP של יד2 (חניה, מעלית, ממ"ד, מרפסת) שנמצאים כ-tags בכרטיסי החיפוש.

### שלב 3 — בדיקה חיה ודיפלוי

- בדיקת GraphQL על 5 נכסי מדל"ן
- השוואה מול מה שנמצא באתר
- דיפלוי ובדיקת בקפיל

### מה לא משתנה
- **הסורק** של מדל"ן (`scout-madlan-jina`, `parser-madlan-html.ts`) — לא נוגעים
- **הסורק** של יד2 (`scout-yad2-jina`) — לא נוגעים
- **הסורק** של הומלס — לא נוגעים

### קבצים

| קובץ | פעולה |
|---|---|
| `supabase/functions/_shared/madlan-detail-parser.ts` | **חדש** — GraphQL API parser |
| `supabase/functions/backfill-property-data-jina/index.ts` | מדל"ן עובר מ-Jina ל-GraphQL API |
| `supabase/functions/_experimental/parser-yad2.ts` | שיפור חילוץ tags מ-SERP |

### סיכון
**נמוך מאוד** — ה-API של מדל"ן הוא ציבורי (אותו API שהאתר עצמו קורא לו). לא צריך מפתח API, לא צריך התחברות. הבקפיל לא משנה את הסורק.

