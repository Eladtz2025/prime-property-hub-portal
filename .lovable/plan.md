
# תיקון Personal Scout - הושלם ✅

## מה תוקן

### ✅ בעיה 1: עדכון סטטיסטיקות
**לפני:** `supabase.rpc('increment')` - לא קיים ולא עובד
**אחרי:** קריאה ידנית + עדכון עם finalization אוטומטי

### ✅ בעיה 2: Timeout של Workers
**לפני:** 5 דפים X 3 מקורות = 75+ שניות (מעל ה-60s limit)
**אחרי:** 2 דפים X מקור = ~27 שניות (בטוח)

### ✅ בעיה 3: Finalization
**לפני:** ריצה נשארת "running" לנצח
**אחרי:** כשכל הלידים מסתיימים → status = "completed"

## תוצאות אימות

| מדד | תוצאה |
|-----|-------|
| Worker response | ✅ 200 OK |
| Duration | 26.9s (בתוך 60s) |
| Matches saved | 25 |
| leads_completed | מתעדכן ✅ |
| total_matches | מתעדכן ✅ |
| Yad2 neighborhoods | 92% |

## עוד לעשות

### שלב 1: תיקון ריצות תקועות (SQL)
```sql
-- Fix stuck runs
UPDATE personal_scout_runs
SET status = 'completed', 
    completed_at = NOW(),
    leads_completed = (SELECT COUNT(DISTINCT lead_id) FROM personal_scout_matches WHERE run_id = personal_scout_runs.id)
WHERE status = 'running' AND created_at < NOW() - INTERVAL '1 hour';
```

### שלב 2: Cron Job
```sql
SELECT cron.schedule(
  'personal-scout-daily',
  '0 23 * * *',  -- 23:00 UTC = 01:00 IST (after midnight)
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/personal-scout-trigger',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

## קבצים שעודכנו

| קובץ | שינוי |
|------|-------|
| `supabase/functions/personal-scout-worker/index.ts` | תיקון increment + הפחתת דפים ל-2 |

