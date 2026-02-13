
# תיקון ריצת ההתאמות האוטומטית

## מה מצאתי

ההתאמות **עובדות מצוין** כשמפעילים ידנית (הרצתי עכשיו - 544 נכסים עם התאמות, 855 התאמות סה"כ). הבעיה היא שההפעלה האוטומטית לא עובדת.

### שורש הבעיה: התנגשות בין Cron ל-schedule_times

הפונקציה `trigger-matching` מכילה **בדיקה כפולה מיותרת** של תזמון:
1. ה-**Cron** קורא לפונקציה ב-21:00 UTC (23:00 ישראל)
2. הפונקציה עצמה בודקת אם השעה נמצאת ב-`schedule_times` מהגדרות ה-DB
3. `schedule_times` מוגדר כ-`["07:00"]`
4. 23:00 לא שווה ל-07:00, אז הפונקציה עושה **skip** כל לילה

**תוצאה:** ההתאמות לא רצו אוטומטית כבר ימים (ריצות אחרונות היו ידניות/forced).

---

## פתרון מוצע

**הסרת בדיקת schedule_times מהפונקציה** - הפונקציה תסמוך רק על ה-Cron לתזמון. הלוגיקה הכפולה מיותרת ויוצרת סיכון להתנגשויות בדיוק כמו שקרה כאן.

### שינוי ב-`supabase/functions/trigger-matching/index.ts`

- הסרת שורות 176-197 (בדיקת `schedule_times` ודילוג)
- הפונקציה תמיד תרוץ כשנקראת (בין אם מ-Cron או ידנית)
- שמירה על `force` כפרמטר לתיעוד בלבד

### עדכון Cron schedule

- עדכון ה-Cron מ-`0 21 * * *` ל-`0 5 * * *` (07:00 ישראל) כדי להתאים ללוח הזמנים שהמשתמש הגדיר

---

## פירוט טכני

```typescript
// הסרת הבלוק הזה (שורות 176-197):
const matchingSettings = await fetchCategorySettings(supabase, 'matching');
const scheduleTimes = (matchingSettings).schedule_times || ['09:15', '18:15'];
const now = new Date();
const israelTime = now.toLocaleTimeString('en-GB', { ... });
if (!isForced && !scheduleTimes.includes(israelTime)) {
  console.log('Skipping matching...');
  return new Response(...);
}
```

עדכון Cron:
```sql
SELECT cron.schedule('match-leads-job', '0 5 * * *', ...);
```
(05:00 UTC = 07:00 ישראל)

| שינוי | פירוט |
|---|---|
| `trigger-matching/index.ts` | הסרת בדיקת schedule_times |
| `cron.job` | עדכון schedule ל-07:00 ישראל (05:00 UTC) |
