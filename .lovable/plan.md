

## תיקון: cron jobs של dedup ו-matching נכשלים

### מה מצאתי (בדיקה בפועל)

בדקתי את ה-cron jobs ואת לוגי הריצות:

- **Job 32 (daily-dedup-scan)** ו-**Job 33 (daily-matching)** נכשלים כל יום עם:
  ```
  ERROR: unrecognized configuration parameter "supabase.supabase_url"
  ```
- בדקתי גם את `current_setting('supabase.url')` ו-`current_setting('supabase.service_role_key')` — **שניהם מחזירים NULL** בסביבה הזו
- לעומת זאת, **Jobs שעובדים** (backfill, availability) משתמשים ב-URL ומפתח anon **קשיחים** (hardcoded)
- שתי הפונקציות מוגדרות עם `verify_jwt = false` — אז מפתח anon מספיק

### מסקנה
הגישה של `current_setting(...)` לא עובדת בכלל בסביבה הזו. צריך לעבור ל-hardcoded URL + anon key — בדיוק כמו שאר ה-jobs שעובדים.

### תיקון
מיגרציה אחת שמעדכנת את שני ה-jobs:

**Job 32 (daily-dedup-scan):**
```sql
SELECT cron.alter_job(
  job_id := 32,
  command := $$
    SELECT net.http_post(
      url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/detect-duplicates',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGci...9mM"}'::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    ) AS request_id;
  $$
);
```

**Job 33 (daily-matching):** — אותו pattern עם URL של `trigger-matching`

### למה זה יעבוד
- זה **בדיוק** אותו pattern כמו jobs 24, 26, 30 שעובדים כבר חודשים
- URL קשיח + anon key קשיח — ללא תלות ב-`current_setting` שלא עובד
- `verify_jwt = false` מאפשר anon key

### סיכון: אפס
שינוי cron job configuration בלבד, ללא שינוי קוד.

