# שילוב טבלת הרחובות בפרסר Homeless - ✅ הושלם

## מה בוצע

### שינויים שנעשו:

1. **`_experimental/parser-homeless.ts`**
   - ✅ הומר ל-`async function`
   - ✅ נוסף import ל-`street-lookup.ts`
   - ✅ נוסף DB lookup כ-fallback אחרי regex
   - ✅ שונה מ-`rows.each()` ל-`for...of` לתמיכה ב-await

2. **`scout-homeless/index.ts`**
   - ✅ עודכן לקריאה עם `await` ו-`supabase` client

3. **`_personal-scout/parser-homeless.ts`**
   - ✅ סונכרן עם אותם שינויים

## סדר עדיפות חדש לזיהוי שכונות

1. `neighborhoodText` (עמודה 4) - regex ישיר
2. `streetText` (עמודה 5) - regex  
3. `fullRowText` - regex בכל הטקסט
4. **חדש:** `streetText` → חיפוש בטבלת `street_neighborhoods` (1,245 רחובות)

## תוצאה צפויה

| שדה | לפני | אחרי (צפי) |
|-----|------|------------|
| שכונות | 89% | 95%+ |
| עיר | 100% | 100% |
| מחיר | 93% | 93% |

## הערות טכניות

- ה-Supabase client מועבר כ-optional parameter
- אם ה-lookup נכשל, הפרסר ממשיך בשקט (לא שובר)
- לוגים מודפסים כשיש התאמה מוצלחת מה-DB
