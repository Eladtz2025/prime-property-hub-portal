

# הסרת triggerAutoBackfill מ-run-helpers.ts

## הבעיה
הפונקציה `triggerAutoBackfill` ב-`supabase/functions/_shared/run-helpers.ts` מפעילה השלמת נתונים מיד אחרי כל סריקת נכסים, בניגוד למדיניות שנקבעה — שהשלמת נתונים רצה רק בחלון 00:00-02:30 דרך ה-Cron.

זה מה שגרם לריצה ב-23:22 אתמול (אחרי סריקת homeless) ולבזבוז משאבים כל הלילה.

## הפתרון
מחיקה מלאה של `triggerAutoBackfill` והקריאה אליה מתוך `checkAndFinalizeRun`.

## פירוט טכני

### קובץ: `supabase/functions/_shared/run-helpers.ts`
1. מחיקת הפונקציה `triggerAutoBackfill` (שורות 183-230 בערך)
2. מחיקת הקריאה אליה בסוף `checkAndFinalizeRun` (שורות 172-176 בערך) — הבלוק שבודק `if (newPropertiesCount > 0)` ומפעיל את ה-backfill

### פריסה מחדש
כל ה-Edge Functions שמשתמשות ב-`run-helpers.ts` (scout-yad2, scout-madlan, scout-homeless) ייהנו מהשינוי אוטומטית כי הן מייבאות את הקובץ המשותף.

### מה לא משתנה
- ה-Cron של backfill ממשיך לעבוד כרגיל בחלון 00:00-02:30
- שום דבר אחר ב-`checkAndFinalizeRun` לא משתנה

