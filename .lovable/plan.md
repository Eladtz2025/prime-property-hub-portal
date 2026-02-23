
# תיקון מערכת ההתאמות - 2 באגים

## בעיה 1: פונקציה שלא קיימת (הבעיה העיקרית)
כרטיס ההתאמות ב-ChecksDashboard קורא לפונקציה `personal-scout` שלא קיימת בכלל (404). לכן הכפתור "הפעל" תמיד נכשל.

**תיקון:** שינוי הקריאה בקובץ `src/components/scout/ChecksDashboard.tsx` שורה 344 מ-`personal-scout` ל-`trigger-matching` עם הפרמטרים הנכונים (`force: true, send_whatsapp: false`).

## בעיה 2: בדיקת end_time חוסמת ריצות ידניות
בקובץ `supabase/functions/trigger-matching/index.ts`, בדיקת `isPastEndTime` (שורות 184-200) חוסמת את הפונקציה גם כאשר `force: true`. ה-kill switch כבר מדלג עם force, אבל בדיקת end_time לא.

**תיקון:** הוספת תנאי `!isForced` לבדיקת end_time, כך שריצות ידניות (force) ידלגו גם על בדיקת שעת הסיום.

---

## פרטים טכניים

### קובץ 1: `src/components/scout/ChecksDashboard.tsx`
- שורה 344: שינוי `supabase.functions.invoke('personal-scout')` ל-`supabase.functions.invoke('trigger-matching', { body: { send_whatsapp: false, force: true } })`

### קובץ 2: `supabase/functions/trigger-matching/index.ts`
- שורה 192: שינוי `if (endTimeReached)` ל-`if (endTimeReached && !isForced)` כך שריצות ידניות לא ייחסמו על ידי חלון הזמן

### פריסה
- `trigger-matching`
