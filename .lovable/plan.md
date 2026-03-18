

## שינוי לוגיקת זכאות בדיקת זמינות מ-שעות ל-תאריכים

### הבעיה
הלוגיקה הנוכחית דורשת בדיוק 48 שעות (או 8 ימים) מרגע הבדיקה האחרונה. אם נכס נבדק ב-16:00, הוא יהיה זכאי רק ב-16:00 עוד יומיים — אחרי שהקרון של 05:00 כבר סיים.

### הפתרון
שינוי ה-RPC `get_properties_needing_availability_check` כך שההשוואה תהיה על בסיס **תאריך** (יום קלנדרי בשעון ישראל) ולא על בסיס שעות מדויקות.

### שינוי טכני

**עדכון הפונקציה `get_properties_needing_availability_check`** — החלפת תנאי ה-interval בהשוואת תאריכים:

```sql
-- במקום:
sp.availability_checked_at < now() - (p_recurring_recheck_days || ' days')::interval

-- יהיה:
(sp.availability_checked_at AT TIME ZONE 'Asia/Jerusalem')::date 
  <= (now() AT TIME ZONE 'Asia/Jerusalem')::date - p_recurring_recheck_days
```

אותו הדבר עבור `p_first_recheck_days` ו-`p_min_days_before_check`.

**תוצאה**: נכס שנבדק ב-16:00 ביום 16/3 ייחשב כ"נבדק ב-16/3". בקרון של 05:00 ב-18/3 (יומיים אחרי), הוא כבר זכאי — כי 18 - 16 = 2 ≥ `p_recurring_recheck_days`.

### היקף השינוי
- קובץ אחד: מיגרציית SQL לעדכון ה-RPC
- אין שינוי בקוד TypeScript, בקרון, או בפונקציות Edge

