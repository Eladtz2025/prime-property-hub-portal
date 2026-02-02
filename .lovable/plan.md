

## תוכנית - שיפור Backfill לרציפות מלאה

### מצב קיים

| יכולת | סטטוס | הערות |
|-------|-------|-------|
| Self-continuation | ✅ עובד | שורות 620-633 ב-index.ts |
| Auto-backfill אחרי סריקות | ✅ עובד | שורות 166-171 ב-run-helpers.ts |
| Timeout מוגבל | ❌ 5 דקות | עוצר מוקדם מדי |
| Task נתקע | ❌ | processed_items=0 למרות ש-total=5,279 |

---

### בעיות שזוהו

1. **הבקפיל הנוכחי נתקע** - task `2a87efbb...` מסומן running אבל לא מתקדם
2. **timeout קצר** - ההגדרה `timeout_minutes: 5` לא מספיקה לעיבוד 5,000+ נכסים
3. **stuck task detection** - יש זיהוי של 10 דקות אבל צריך לנקות ידנית

---

### פתרון מוצע

#### שלב 1: ניקוי Task תקוע
ניקוי ה-task הנוכחי שנתקע לפני שמתחילים מחדש

#### שלב 2: עדכון הגדרות Timeout
שינוי `timeout_minutes` מ-5 ל-30 כדי לאפשר ריצות ארוכות יותר

#### שלב 3: שיפור Self-Continuation
הקוד כבר תומך ב-self-triggering - רק צריך לוודא שהוא עובד נכון:

```text
┌─────────────────────────────────────────────────────────────┐
│                    תהליך Backfill משופר                      │
├─────────────────────────────────────────────────────────────┤
│ 1. התחלת Batch (20 נכסים)                                   │
│    ↓                                                        │
│ 2. עיבוד נכס אחד (סריקה + עדכון)                            │
│    ↓                                                        │
│ 3. Delay 1.5 שניות                                          │
│    ↓                                                        │
│ 4. בדיקה: יש עוד נכסים?                                     │
│    ├── כן → Fire-and-forget לאותה פונקציה (action: continue)│
│    └── לא → סימון completed                                 │
└─────────────────────────────────────────────────────────────┘
```

#### שלב 4: Schedule מתוזמן (כבר קיים!)
הגדרות backfill כבר קיימות בטבלת `scout_settings`:
- `schedule_times: ['03:00', '12:00']` - שעות ריצה
- `enabled: true` - מופעל

**חסר:** cron job שמפעיל את הbackfill בשעות האלה

---

### שינויים נדרשים

#### 1. SQL לניקוי Tasks תקועים
```sql
UPDATE backfill_progress 
SET status = 'stopped', 
    completed_at = NOW(),
    error_message = 'Manually stopped - restart with new settings'
WHERE status = 'running' 
  AND task_name LIKE 'data_completion%';
```

#### 2. עדכון scout_settings
```sql
UPDATE scout_settings 
SET setting_value = 30 
WHERE category = 'backfill' 
  AND setting_key = 'timeout_minutes';
```

#### 3. יצירת Cron Job לbackfill מתוזמן
```sql
-- Schedule backfill at 03:00 and 12:00 Israel time
SELECT cron.schedule(
  'backfill-scheduled-run',
  '0 1,10 * * *',  -- UTC: 01:00, 10:00 = Israel: 03:00, 12:00
  $$
  SELECT net.http_post(
    url:='https://jswumsdymlooeobrxict.supabase.co/functions/v1/backfill-property-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb,
    body:='{"action": "start"}'::jsonb
  );
  $$
);
```

---

### סיכום שינויים

| קובץ/מיקום | שינוי |
|------------|-------|
| Database: backfill_progress | ניקוי tasks תקועים |
| Database: scout_settings | עדכון timeout ל-30 דקות |
| Database: cron.schedule | הוספת cron job לbackfill מתוזמן |

---

### התנהגות צפויה אחרי השינויים

1. **Backfill ידני** - לחיצה על "התחל" תריץ עד הסוף (עם self-continuation)
2. **Backfill מתוזמן** - פעמיים ביום (03:00, 12:00) יבדוק אם יש נכסים לעדכון
3. **Auto-backfill אחרי סריקות** - כבר עובד! מופעל אוטומטית אחרי כל סריקה עם נכסים חדשים

---

### הערכת זמנים

עם ~5,000 נכסים לעדכון:
- קצב: ~20-25 נכסים לדקה (עם delays)
- זמן כולל: ~3-4 שעות
- הקוד כבר תומך ב-self-continuation אז לא צריך לחכות - הוא ימשיך ברקע

