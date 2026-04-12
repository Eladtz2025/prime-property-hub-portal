

## תוכנית: תיקון cron job של כפילויות

### שורש הבעיה

ה-cron job `cleanup-orphan-duplicates-hourly` קורא ל-`detect-duplicates` באמצעות `net.http_post`, אבל בלוגים אין אף קריאה לפונקציה. הסיבה הסבירה ביותר: ה-cron משתמש ב-**anon key** ב-Authorization header, אבל ייתכן שה-`net.http_post` נכשל בשקט (timeout, DNS, או בעיית רשת פנימית).

### תיקון

1. **מיגרציה לעדכון ה-cron** — שינוי ה-Authorization header מ-anon key ל-service_role_key (דרך `current_setting('supabase.service_role_key')` שזמין ב-postgres):

```sql
SELECT cron.unschedule('cleanup-orphan-duplicates-hourly');

SELECT cron.schedule(
  'daily-dedup-scan',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('supabase.supabase_url') || '/functions/v1/detect-duplicates',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);
```

2. **גם לתקן את שם הג'וב** — השם `cleanup-orphan-duplicates-hourly` מטעה (הוא רץ יומית, לא שעתי), נשנה ל-`daily-dedup-scan`.

### למה service_role_key?

כל ה-cron jobs האחרים במערכת (availability, matching, scout, backfill) משתמשים בדפוס `current_setting('supabase.service_role_key')` שהוא הגישה הנכונה — מפתח דינמי שלא hardcoded. ה-cron של הכפילויות הוא היחיד שמשתמש ב-anon key hardcoded.

### סיכון: נמוך מאוד
- החלפת cron job בלבד
- הפונקציה עצמה לא משתנה
- תוצאה: הכפילויות ירוצו כל לילה ב-04:00 ישראל כמתוכנן

