
# תוכנית: הוספת ריצה אוטומטית ל-Personal Scout

## מה יתווסף

הוספת cron job חדש שיריץ את `personal-scout-trigger` בשעה **01:00 בלילה** (שעון ישראל).

## המרת שעון

| שעון ישראל | UTC |
|------------|-----|
| 01:00 | 23:00 (יום קודם) |

הערה: ישראל ב-UTC+2 (חורף) או UTC+3 (קיץ). נשתמש ב-23:00 UTC שזה בערך 01:00-02:00 לפי העונה.

## פקודת SQL

```sql
SELECT cron.schedule(
  'personal-scout-daily',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/personal-scout-trigger',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## לוח זמנים לאחר ההוספה

| Job | לוז | תיאור |
|-----|-----|-------|
| cleanup-stuck-runs | כל 5 דקות | ניקוי ריצות תקועות |
| scout-properties-job | כל 10 דקות | סריקה כללית |
| match-leads-job | כל 15 דקות | התאמות |
| **personal-scout-daily** | **23:00 UTC (01:00 ISR)** | **סריקה אישית ללידים** |
| backfill-entry-dates-job | 01:00, 10:00 UTC | מילוי תאריכי כניסה |
| trigger-availability-check-daily | 03:00 UTC | בדיקת זמינות |

## תוצאה צפויה

כל לילה בשעה 01:00 (זמן ישראל):
1. הפונקציה `personal-scout-trigger` תופעל אוטומטית
2. תסרוק את כל הלידים הזכאים (עם העדפות עיר)
3. תשמור התאמות חדשות ב-`personal_scout_matches`
4. תעדכן סטטיסטיקות ב-`personal_scout_runs`

## הערות

- הריצה תיקח כ-9 דקות (35 לידים × 15 שניות delay)
- כל ליד יסרק עד 10 דפים בכל מקור (yad2, madlan, homeless)
- התוצאות יופיעו בטאב "סקאוט אישי" ב-UI
