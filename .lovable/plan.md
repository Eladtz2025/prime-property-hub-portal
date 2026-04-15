

# תיקון חילוץ פיצ'רים — גישה חדשה לגמרי

## מה מצאתי

### תגלית קריטית: Homeless detail page עובד עם fetch ישיר
בדקתי עכשיו — `fetch("https://www.homeless.co.il/rent/viewad,733159.aspx")` מחזיר HTML מלא **בלי חסימה**. לא צריך Jina, לא צריך proxy.

ב-HTML של דף הנכס, כל פיצ'ר מסומן בצורה חד-משמעית:
```text
<div class="IconOption on">...מרפסת: 1</div>     ← יש מרפסת
<div class="IconOption off">...מעלית</div>         ← אין מעלית
<div class="IconOption off">...חניה: אין</div>     ← אין חניה
<div class="IconOption off">...ממד</div>            ← אין ממ"ד
<div class="IconOption off">...מחסן</div>           ← אין מחסן
<div class="IconOption off">...משופצת</div>         ← לא משופצת
<div class="IconOption off">...חיות מחמד</div>      ← אין חיות מחמד
<div class="IconOption on">...ריהוט</div>           ← יש ריהוט
```

**`on` = יש, `off` = אין.** אפס ניחוש. אפס regex על טקסט חופשי.

בנוסף, דף הנכס מכיל גם `מ"ר: 55` (גודל) ו-`קומה: 4 מתוך 4` — נתונים שלא קיימים בדף החיפוש.

### מה לא עובד היום
- הסורק סורק דפי חיפוש (SERP) → אין פיצ'רים, אין גודל
- הבקפיל משתמש ב-Jina → נחסם, מקבל homepage, מנחש שגוי
- לא משתמשים ב-API בתשלום

## תוכנית — סריקה דו-שלבית להומלס

### שלב 1: Helper חדש — `homeless-detail-parser.ts`
פונקציה `fetchHomelessDetailFeatures(sourceUrl)` שמחזירה `{ features, size }`:
- `fetch(sourceUrl)` ישיר (לא Jina)
- Cheerio parse של ה-HTML
- לכל `div.IconOption`:
  - `class="IconOption on"` → `true`
  - `class="IconOption off"` → `false`
- חניה: אם `on` אבל הטקסט מכיל `חניה: אין` / `חניה ציבורית` / `חניה ברחוב` → `false`
- חניה: אם `on` ו-`חניה משותפת` → `true`
- גודל: חילוץ מ-`מ"ר: X`
- timeout: 10 שניות, retry: 1

### שלב 2: שילוב בסורק `scout-homeless-jina/index.ts`
אחרי שה-parser מחלץ רשימת נכסים מה-SERP, **לכל נכס חדש** (שלא קיים ב-DB):
1. קריאה ל-`fetchHomelessDetailFeatures(property.source_url)`
2. מיזוג `features` + `size` לתוך ה-property object
3. סימון `backfill_status = 'not_needed'`

### שלב 3: עדכון הבקפיל
ב-`backfill-property-data-jina/index.ts` — להומלס: במקום Jina, להשתמש באותו `fetchHomelessDetailFeatures` ישיר. כך גם נכסים ישנים שכבר ב-DB יקבלו פיצ'רים נכונים.

### שלב 4: תיקון `parser-utils.ts`
- `חניה משותפת` → `true` (לא `false`)
- `חניה ציבורית` / `חניה ברחוב` → `false`

### מה לא משתנה
- **הסורק עצמו** (`parser-homeless.ts`) — לא נוגעים. הוא מושלם.
- מדל"ן ויד2 — נשארים כמו שהם (שמרניים, בלי ניחוש)
- לא משתמשים ב-API בתשלום

## קבצים

| קובץ | שינוי |
|---|---|
| `supabase/functions/_shared/homeless-detail-parser.ts` | **חדש** — fetch ישיר + Cheerio parse של `IconOption on/off` |
| `supabase/functions/scout-homeless-jina/index.ts` | הוספת קריאה ל-detail page לכל נכס חדש |
| `supabase/functions/backfill-property-data-jina/index.ts` | החלפת Jina ב-fetch ישיר להומלס |
| `supabase/functions/_experimental/parser-utils.ts` | תיקון חניה משותפת/ציבורית |

## בדיקה אחרי
- דיפלוי
- בדיקה חיה על 5 נכסי הומלס **חדשים** — עם evidence מה-HTML (class on/off)
- השוואה מול האתר

## סיכון
**אפסי** — fetch ישיר עובד (בדקתי עכשיו). Cheerio כבר בשימוש בפרויקט. לא נוגעים בסורק הקיים.

