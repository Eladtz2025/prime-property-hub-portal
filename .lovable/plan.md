

# תוכנית תיקונים — Backfill + פרסום

כל 5 התיקונים אומתו מול הקוד בפועל. הכל מדויק.

## תיקון 1: DB Constraint חוסם פרסום (דחוף ביותר)
**מיגרציה** — הרחבת CHECK constraint על `social_posts.status` להוסיף `ready_to_copy`.
בנוסף: עדכון 2 הפוסטים התקועים מ-`publishing` ל-`ready_to_copy`.

## תיקון 2: Parking Fallback — בדיקת דפוסים שליליים
**קובץ:** `supabase/functions/_shared/yad2-detail-parser.ts` שורות 277-283
הוספת regex patterns שליליים (`אין חניה`, `ללא חניה`, `בלי חניה`) לפני הרישום כ-true.

## תיקון 3: Feature Grid Sanity Check
**קובץ:** `supabase/functions/_shared/yad2-detail-parser.ts` — אחרי `extractFeatureItems`
אם 10+ פיצ'רים וכולם true (0 false) → מחיקת כל הפיצ'רים כי CSS parsing שבור.

## תיקון 4: immediate_entry ברירת מחדל
**קובץ:** `supabase/functions/backfill-property-data-jina/index.ts` שורה 1734
שינוי `immediate_entry: true` ל-`immediate_entry: false`.

## תיקון 5: Merge Logic — לא לדרוס נתונים קיימים
**קובץ:** `supabase/functions/backfill-property-data-jina/index.ts` שורות 474, 538, 630, 1004-1010
שינוי ל-merge שדורס רק כש-existing הוא `undefined`/`null`.

## סדר ביצוע
1. מיגרציה (תיקון 1)
2. שינויי קוד (תיקונים 2-5)
3. Deploy edge functions: `backfill-property-data-jina`, `social-publish`

## הערה
אחרי התיקונים — מומלץ לאפס `backfill_status = 'pending'` לנכסים שכבר עברו backfill כדי שירוצו מחדש עם הלוגיקה המתוקנת. זה ידרוש אישור נפרד.

