
# תיקון Cron Jobs - הפניה לפונקציות Jina

## הבעיה
שני cron jobs מכוונים לפונקציות הישנות (Firecrawl) שכבויות:
- **בדיקת זמינות**: הcron קורא ל-`trigger-availability-check` (כבוי) במקום `trigger-availability-check-jina` (דלוק)
- **השלמת נתונים**: הcron קורא ל-`backfill-property-data` (כבוי) במקום `backfill-property-data-jina` (דלוק)

## מה דלוק ומה כבוי

| תהליך | Kill Switch | סטטוס |
|---|---|---|
| סריקות 2 (Jina) | `process_scans_jina` | דלוק |
| בדיקת זמינות 2 (Jina) | `process_availability_jina` | דלוק |
| השלמת נתונים 2 (Jina) | `process_backfill_jina` | דלוק |
| כפילויות | `process_duplicates` | דלוק |
| התאמות | `process_matching` | דלוק |
| סריקות 1 (Firecrawl) | `process_scans` | כבוי |
| בדיקת זמינות 1 | `process_availability` | כבוי |
| השלמת נתונים 1 | `process_backfill` | כבוי |

## התיקון
עדכון שני cron jobs דרך ה-RPC `update_cron_schedule` כדי להפנות לפונקציות Jina:

### 1. עדכון cron של בדיקת זמינות
שינוי `availability-check-continuous` מ-`trigger-availability-check` ל-`trigger-availability-check-jina`.
הזמן נשאר `0 3 * * *` (05:00 שעון ישראל).

### 2. עדכון cron של השלמת נתונים
שינוי `backfill-data-completion-job` מ-`backfill-property-data` ל-`backfill-property-data-jina`.
הזמן נשאר `0 22 * * *` (00:00 שעון ישראל).

## פרטים טכניים
מיגרציה אחת עם שתי קריאות RPC:

```sql
SELECT public.update_cron_schedule(
  'availability-check-continuous',
  '0 3 * * *',
  $$SELECT net.http_post(
    url := '<supabase_url>/functions/v1/trigger-availability-check-jina',
    headers := '...'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;$$
);

SELECT public.update_cron_schedule(
  'backfill-data-completion-job',
  '0 22 * * *',
  $$SELECT net.http_post(
    url := '<supabase_url>/functions/v1/backfill-property-data-jina',
    headers := '...'::jsonb,
    body := '{"action": "start"}'::jsonb
  );$$
);
```

## מה לא ישתנה
- זמני הריצה נשארים אותו דבר
- סריקות 2, כפילויות, והתאמות כבר עובדים נכון
- אף פונקציה לא נמחקת או משתנה
- רק מפנים את ה-cron ליעד הנכון

## תוצאה
כל 5 התהליכים הפעילים יופעלו נכון דרך ה-cron:

```text
00:00 IL  ->  backfill-property-data-jina     (היום: backfill-property-data - כבוי!)
03:00 IL  ->  detect-duplicates               (תקין)
05:00 IL  ->  trigger-availability-check-jina  (היום: trigger-availability-check - כבוי!)
07:00 IL  ->  trigger-matching                 (תקין)
23:00 IL  ->  trigger-scout-all-jina           (תקין)
```
