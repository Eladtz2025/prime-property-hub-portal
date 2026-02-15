

# תיקון לוח זמנים ופקודות Cron - 3 בעיות קריטיות

## הבעיות שנמצאו

### בעיה 1: Backfill ו-Duplicates מוחלפים
- Backfill (השלמת נתונים) רץ ב-03:00 ישראל במקום 00:00
- Duplicates (כפילויות) רץ ב-00:00 ישראל במקום 03:00
- התוצאה: הכפילויות רצות לפני שהנתונים הושלמו, מה שאומר שהן עובדות על נתונים חסרים

### בעיה 2: Matching רץ ב-23:00 במקום 07:00
- ההתאמות רצות באותו חלון זמן של הסריקות (23:00)
- זה גורם לתחרות על משאבים וההתאמות לא נהנות מהנתונים שהושלמו באותו לילה

### בעיה 3: Duplicates קורא לפונקציה השגויה
- הפקודה קוראת ל-`cleanup-orphan-duplicates` (ניקוי קבוצות יתומות)
- צריכה לקרוא ל-`detect-duplicates` (סריקת כפילויות חדשות)
- cleanup רץ אוטומטית בסיום detect, אז כרגע רק הניקוי רץ בלי הסריקה

## הפתרון

מיגרציה אחת שמבצעת:

1. הענקת הרשאות לפונקציית `update_cron_schedule` (GRANT על cron schema)
2. עדכון כל 3 ה-Cron Jobs לזמנים הנכונים
3. תיקון פקודת ה-Duplicates לקרוא ל-`detect-duplicates`

## לוח זמנים אחרי התיקון

```text
23:00  Scouts (סריקות)           - ללא שינוי
00:00  Backfill (השלמת נתונים)   - תוקן מ-03:00
03:00  Duplicates (כפילויות)     - תוקן מ-00:00 + פקודה תוקנה
05:00  Availability (זמינות)     - ללא שינוי
07:00  Matching (התאמות)          - תוקן מ-23:00
```

## פרטים טכניים

### שלב 1: הרשאות
```sql
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;
```

### שלב 2: עדכון ישיר של cron.job
```sql
-- Backfill: 00:00 Israel = 22:00 UTC
UPDATE cron.job SET schedule = '0 22 * * *' 
WHERE jobid = 26;

-- Duplicates: 03:00 Israel = 01:00 UTC + fix command
UPDATE cron.job 
SET schedule = '0 1 * * *',
    command = [call detect-duplicates instead of cleanup]
WHERE jobid = 25;

-- Matching: 07:00 Israel = 05:00 UTC
UPDATE cron.job SET schedule = '0 5 * * *' 
WHERE jobid = 23;
```

הכל ייעשה במיגרציה אחת, כולל ה-GRANT, כך שלא צריך לעשות שום דבר ידנית.

