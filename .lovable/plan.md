

# תיקון Personal Scout - חלק 2

## מצב נוכחי

### ✅ מה תוקן בהצלחה:
- Worker statistics update - עובד
- Madlan parser - מסונכרן עם פרודקשן
- שיעורי חילוץ מעולים (92% שכונות, 92% גודל)

### ⚠️ מה עדיין לא עובד:
- ריצות נתקעות ב-"running" 
- רק 2 מתוך 35 לידים הושלמו
- אין Cron Job אוטומטי

## בעיית שורש: Concurrency

**הבעיה:** ה-Trigger שולח 35 workers ברצף מהיר עם רק 5 שניות ביניהם.
זה גורם ל:
1. עומס על Edge Functions
2. חלק מה-workers לא מגיעים כלל
3. Supabase מגביל concurrency

**פתרון:** להגדיל את ה-delay בין לידים מ-5 שניות ל-15 שניות.

## תוכנית תיקון

### שלב 1: עדכון Trigger עם delay ארוך יותר

**קובץ:** `supabase/functions/personal-scout-trigger/index.ts`

**שינוי:** שורה 66
```javascript
// OLD:
const DELAY_BETWEEN_LEADS_MS = 5000; // 5 seconds

// NEW:
const DELAY_BETWEEN_LEADS_MS = 15000; // 15 seconds between leads
```

**סיבה:** 35 לידים × 15 שניות = 525 שניות = ~9 דקות. 
זה נותן לכל worker זמן לסיים לפני שהבא מתחיל.

### שלב 2: תיקון ריצות תקועות (SQL)

```sql
-- Fix stuck runs
UPDATE personal_scout_runs
SET status = 'completed', 
    completed_at = NOW(),
    leads_completed = CASE 
      WHEN id = 'd8f299c2-09b1-4fde-b10e-619a35e89b7d' THEN 
        (SELECT COUNT(DISTINCT lead_id) FROM personal_scout_matches WHERE run_id = 'd8f299c2-09b1-4fde-b10e-619a35e89b7d')
      ELSE leads_completed
    END,
    total_matches = CASE 
      WHEN id = 'd8f299c2-09b1-4fde-b10e-619a35e89b7d' THEN 
        (SELECT COUNT(*) FROM personal_scout_matches WHERE run_id = 'd8f299c2-09b1-4fde-b10e-619a35e89b7d')
      ELSE total_matches
    END
WHERE status = 'running' 
  AND created_at < NOW() - INTERVAL '1 hour';
```

### שלב 3: הוספת Cron Job (SQL)

```sql
-- Schedule personal scout to run at 01:00 IST (23:00 UTC)
SELECT cron.schedule(
  'personal-scout-daily',
  '0 23 * * *',  -- 23:00 UTC = 01:00 IST
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/personal-scout-trigger',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVYeLYJec-2vFcGeYPe9mM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### שלב 4: הרצת בדיקה ידנית

לאחר התיקונים, נריץ את ה-Trigger ידנית עם ליד אחד לבדיקה:
```bash
curl -X POST .../personal-scout-trigger -d '{"lead_id": "f6379896-9686-4f75-bb92-75a7059ef859"}'
```

---

## סיכום טכני

| בעיה | סיבה | פתרון |
|------|------|-------|
| רק 2/35 לידים הושלמו | Concurrency overload | הגדלת delay ל-15 שניות |
| ריצות תקועות | Workers לא חוזרים | תיקון ידני + timeout ב-cleanup |
| אין אוטומציה | לא הוגדר cron | הוספת cron job לשעה 01:00 |

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `supabase/functions/personal-scout-trigger/index.ts` | הגדלת DELAY_BETWEEN_LEADS_MS |
| SQL Script | תיקון ריצות + הוספת cron |

## בדיקה

לאחר התיקון:
1. הרצת trigger ידנית עם ליד בודד
2. בדיקה שהסטטוס מתעדכן ל-completed
3. בדיקה שיש התאמות עם שכונות וגודל

