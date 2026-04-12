
## תוכנית: תיקון cron job של התאמות (matching)

### שורש הבעיה

ה-cron job `match-leads-job` (רץ ב-05:00 UTC / 08:00 ישראל) משתמש ב-**anon key hardcoded** — בדיוק אותה בעיה שתיקנו עכשיו ב-dedup. אין אף log בפונקציה `trigger-matching`, מה שאומר שהקריאה נכשלת בשקט.

41 נכסים בסטטוס `new` ממתינים כי ההתאמה לא רצה.

### תיקון

מיגרציה אחת — החלפת ה-cron job:

```sql
SELECT cron.unschedule('match-leads-job');

SELECT cron.schedule(
  'daily-matching',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('supabase.supabase_url') || '/functions/v1/trigger-matching',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{"send_whatsapp": true}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);
```

### אחרי התיקון
אפעיל את הפונקציה ידנית כדי לטפל ב-41 הנכסים הממתינים.

### סיכון: אפסי — החלפת cron בלבד, הפונקציה לא משתנה
