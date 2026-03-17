

## תוכנית מפושטת: ניקוי ריצות תקועות

### למה לא צריך את שלושתם

צודק. הבעיה המרכזית היא שריצות נתקעות בסטטוס "running" וחוסמות ריצות חדשות. מספיק **שינוי אחד בלבד**:

### הפתרון — inline cleanup ב-`trigger-availability-check-jina`

בתחילת כל ריצה חדשה, לפני בדיקת ה-lock, נוסיף 3 שורות שמנקות ריצות תקועות (ישנות מ-15 דקות):

```text
// At the start of trigger-availability-check-jina, before lock check:
UPDATE availability_check_runs 
SET status = 'failed', completed_at = now(), error_message = 'Auto-cleanup: stuck > 15min'
WHERE status = 'running' AND started_at < now() - interval '15 minutes';
```

**למה זה מספיק:**
- כל ריצה חדשה (cron או ידנית) מנקה אוטומטית ריצות תקועות
- לא צריך לתקן את `cleanup-stuck-runs` — ה-cleanup קורה inline
- לא צריך try/finally — גם אם ריצה נתקעת, הבאה אחריה תנקה אותה

### קובץ שישתנה
- `supabase/functions/trigger-availability-check-jina/index.ts` — הוספת ~5 שורות בתחילת הפונקציה

