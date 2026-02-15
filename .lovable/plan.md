

# תיקון פונקציית update_cron_schedule + עדכון זמני Cron

## הבעיה

קיימות שתי גרסאות של הפונקציה `update_cron_schedule`:
- גרסה ישנה: `(p_job_name text, p_new_schedule text)` עם `search_path = 'public'`
- גרסה חדשה: `(p_job_name text, p_new_schedule text, p_new_command text DEFAULT NULL)` עם `search_path = 'cron', 'public'`

PostgreSQL לא מצליח לבחור ביניהן כשקוראים עם 2 פרמטרים (שגיאת "function is not unique").

## פתרון

### שלב 1: מיגרציה - מחיקת הגרסה הישנה

```sql
-- Drop the old 2-param version (search_path = 'public' only)
DROP FUNCTION IF EXISTS public.update_cron_schedule(text, text);

-- Recreate the single unified version with optional command parameter
CREATE OR REPLACE FUNCTION public.update_cron_schedule(
  p_job_name text, 
  p_new_schedule text, 
  p_new_command text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'cron', 'public'
AS $function$
  UPDATE cron.job 
  SET schedule = p_new_schedule,
      command = COALESCE(p_new_command, command)
  WHERE jobname = p_job_name;
$function$;
```

### שלב 2: עדכון זמני ה-Cron + תיקון פקודת הכפילויות (INSERT tool)

לאחר שהמיגרציה תעבור, אפעיל את הפקודות הבאות דרך ה-insert tool:

```sql
-- 1. Data Completion: 00:00 Israel (22:00 UTC)
SELECT update_cron_schedule('backfill-data-completion-job', '0 22 * * *');

-- 2. Deduplication: 03:00 Israel (01:00 UTC) + fix command to call detect-duplicates
SELECT update_cron_schedule(
    'cleanup-orphan-duplicates-hourly',
    '0 1 * * *',
    $cmd$
      SELECT net.http_post(
        url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/detect-duplicates',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb
      );
    $cmd$
);

-- 3. Matching: 07:00 Israel (05:00 UTC)
SELECT update_cron_schedule('match-leads-job', '0 5 * * *');
```

## תוצאה צפויה

לוח זמנים מעודכן:
- 00:00 ישראל: השלמת נתונים
- 03:00 ישראל: כפילויות (קורא ל-detect-duplicates, לא ל-cleanup)
- 05:00 ישראל: בדיקת זמינות (ללא שינוי)
- 07:00 ישראל: התאמת לקוחות
- 23:00 ישראל: סריקות (ללא שינוי)

