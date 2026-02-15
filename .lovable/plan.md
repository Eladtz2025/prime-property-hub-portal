
# תיקון באג בפונקציית בדיקת זמינות + בדיקת Firecrawl

## בעיה 1: באג בקוד (קל לתקן)
בשורה 136 בקובץ `trigger-availability-check/index.ts` נשאר reference למשתנה `processedToday` שהוסר כשהסרנו את ה-daily limit. צריך להחליף אותו.

### תיקון:
- שורה 136: החלפת `processed_today: processedToday` ב-`properties_found: 0`

## בעיה 2: Firecrawl מחזיר 402 (Payment Required)
כל הקריאות ל-Firecrawl API נכשלות עם שגיאת 402, שמשמעותה שנגמרו הקרדיטים או שה-API Key לא תקין. זו לא בעיית קוד - צריך לבדוק את חשבון ה-Firecrawl.

אפשר לבדוק את זה ע"י:
- כניסה לדשבורד של Firecrawl ובדיקת יתרת קרדיטים
- או בדיקה שה-API Key עדיין תקף

## קובץ לעריכה:
- `supabase/functions/trigger-availability-check/index.ts` (תיקון שורה 136)
