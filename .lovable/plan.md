

## תוכנית: השלמת שכונות מטבלת רחובות

### הבעיה
336 דירות פעילות חסרות שכונה. ה-backfill סיים לרוץ עליהן (`completed`) אבל Jina לא חילץ שכונה מהתוכן. בינתיים, יש לנו טבלת `street_neighborhoods` עם 1,140 רחובות ממופים — ובדיקה מראה ש-**237 מתוך 312** דירות אפשר לפתור דרכה.

### הפתרון — שני שלבים

#### שלב 1: מיגרציה חד-פעמית — מילוי שכונות לדירות קיימות

סקריפט SQL שיעשה:
1. חילוץ שם רחוב מהכתובת (הסרת מספר בית)
2. חיפוש בטבלת `street_neighborhoods` לפי שם רחוב + עיר
3. עדכון שדה `neighborhood` רק לדירות שהשכונה חסרה

בנוסף — עבור כתובות מדל"ן שכבר מכילות שם שכונה אחרי הפסיק (למשל "אבי אסף 27, התקווה"), נמפה את השם הזה לערך מנורמל דרך ה-locations config.

#### שלב 2: שיפור ה-backfill — fallback לטבלת רחובות

בקובץ `backfill-property-data-jina/index.ts`, אחרי שורה 602 (שם נבדק `extracted.neighborhood`), נוסיף fallback:

```
if (!prop.neighborhood && !extracted.neighborhood) {
  // 1. Try extracting from address comma part (Madlan style)
  // 2. If not found, lookup street_neighborhoods table
  extracted.neighborhood = resolvedNeighborhood;
}
```

הלוגיקה:
1. אם הכתובת מכילה פסיק → בדוק אם החלק אחרי הפסיק מתאים לשכונה מוכרת (דרך `getNeighborhoodConfig` מ-`_shared/locations.ts`)
2. אם לא → חלץ שם רחוב, חפש ב-`street_neighborhoods`
3. אם נמצא → השתמש ב-`normalizeNeighborhoodToValue` להמיר לערך מנורמל

### קבצים שישתנו
- `supabase/migrations/new_migration.sql` — מיגרציה חד-פעמית למילוי 237+ שכונות
- `supabase/functions/backfill-property-data-jina/index.ts` — הוספת fallback (כ-20 שורות חדשות סביב שורה 602)

### מה לא ישתנה
- לוגיקת ה-matching (כבר עושה lookup בעצמה — לא תושפע)
- Parser של מדל"ן/יד2/הומלס
- טבלת `street_neighborhoods`
- שום דבר ב-UI

### סיכון
נמוך מאוד — ה-fallback רק ממלא שדה ריק, לעולם לא דורס ערך קיים.

