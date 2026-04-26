## הבעיה האמיתית (לא מה שחשבת)

בדקתי את הנתונים — וזו תמונה ברורה ופשוטה:

### 1. ה-backfill נתקע — נכון
- ב-25/4 22:00 התחיל `data_completion_jina`, עיבד 5 מתוך 6, ואז קפא ל-14 שעות (849 דק').
- שוחרר רק כשהפעלתי ידנית את `cleanup-stuck-runs` אתמול.

### 2. אבל הוא לא תקע את הסריקות
בדקתי את כל הסריקות מ-25/4 בערב (אחרי שה-backfill נתקע):
- **Homeless 20:50** — רץ, מצא 233 נכסים ✅
- **Madlan 20:40** — רץ, נחסם ע"י WAF (לא בגלל backfill)
- **Yad2 20:30** — רץ, נחסם ע"י WAF (לא בגלל backfill)
- **Homeless 20:20** — רץ, מצא 242 נכסים ✅

הסריקות שיצאו `partial` יצאו ככה כי **Yad2 ו-Madlan חסומים ע"י Radware** — לא בגלל ה-backfill.

### 3. הבעיה האמיתית — מסוכן לעתיד

**אין cron job ל-`cleanup-stuck-runs`.** הפונקציה קיימת, היא עובדת, אבל **שום דבר לא מפעיל אותה אוטומטית**. בדקתי את כל ה-cron jobs:

```
auto-publish-every-5-min        */5 * * * *
availability-check-continuous   20 0 * * *
availability-watchdog           */5 * * * *
backfill-data-completion-job    0 22 * * *
daily-dedup-scan                0 1 * * *
daily-matching                  0 5 * * *
scout-properties-job            */5 20-21 * * *
social-scheduler-every-5-min    */5 * * * *
```

**אין `cleanup-stuck-runs-job`.** לכן ה-backfill נתקע ל-14 שעות — לא היה מי שינקה אותו.

זה מה שאסור שיקרה שוב.

---

## מה אעשה

### תיקון 1: cron job ל-cleanup (מיגרציה)
מוסיף job שירוץ כל 5 דקות:
```sql
SELECT cron.schedule(
  'cleanup-stuck-runs-job',
  '*/5 * * * *',
  $$ SELECT net.http_post(
       url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/cleanup-stuck-runs',
       headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon>"}'::jsonb,
       body := '{}'::jsonb,
       timeout_milliseconds := 30000
     ); $$
);
```

מעכשיו, כל backfill/scout/availability שתקוע יותר מ-5-15 דק' (לפי הסף בקוד) ייסגר אוטומטית בתוך 5 דק'. **לא יהיה יותר מצב של 14 שעות תקוע.**

### תיקון 2: הקשחת הסף ב-backfill עצמו
בקוד `backfill-property-data-jina` כבר יש בדיקה: אם backfill ישן רץ יותר מ-10 דק', הוא נסגר אוטומטית כשמנסים להתחיל אחד חדש (שורה 408). זה כבר מגן על הפעלה הבאה — לא צריך לגעת.

### תיקון 3 (אופציונלי): אינדיקציה ב-UI
להוסיף ב-Admin DevOps התראה אם יש backfill שרץ יותר מ-30 דק' — שתראה את זה לפני שאני אצטרך להגיד לך.

---

## מה לא אעשה
- לא אגע בלוגיקה של הסריקות עצמן (הן עובדות).
- לא אגע ב-Yad2/Madlan blocking (זה נושא אחר — דורש פרוקסי או Direct API).
- לא אריץ סריקות.

---

## תוצאה
- backfill תקוע ייסגר תוך 5 דק' אוטומטית, לעולם לא 14 שעות.
- הסריקות יישארו ללא שינוי (הן עובדות חוץ מ-WAF).
- אופציונלי: התראה ב-UI.
