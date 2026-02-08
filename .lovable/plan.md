

# סידור Cron Jobs -- ביטול חפיפות

## מצב נוכחי: 7 cron jobs

```text
Job #   | Name                            | Schedule    | Purpose
--------|--------------------------------|-------------|--------
8       | scout-properties-job            | */10 * * * * | trigger-scout-all (schedule check)
10      | cleanup-stuck-runs              | */5 * * * *  | cleanup everything stuck
12      | match-leads-job                 | */15 * * * * | trigger-matching (schedule: 23:00)
14      | backfill-entry-dates-job        | 0 1,10 * * * | backfill-entry-dates-fast (DEAD!)
16      | backfill-data-completion-job    | 0 1,10 * * * | backfill-property-data
19      | availability-check-continuous   | */10 * * * * | trigger-availability-check
20      | cleanup-orphan-duplicates-hourly| 0 * * * *    | cleanup-orphan-duplicates
```

## בעיות שזוהו

1. **`backfill-entry-dates-fast` (job 14) -- פונקציה מתה**: ה-cron קורא לפונקציה שלא קיימת בקוד. כל הפעלה נכשלת בשקט. צריך למחוק.

2. **Availability check חופף סקאוטים**: שניהם משתמשים ב-Firecrawl. כשרצים ביחד הם מתחרים על מכסה ותוקעים אחד את השני.

3. **Backfill-property-data ב-12:00 חופף Madlan**: ה-backfill משתמש ב-Firecrawl, ו-Madlan סורק באותו זמן.

4. **Cleanup כל 5 דק מיותר**: 99% מהריצות מחזירות "No running runs". בזבוז Edge Function invocations.

5. **Matching כל 15 דק מיותר**: בודק schedule_times ויוצא. נקרא ~96 פעם ביום, עובד פעם אחת.

## פתרון מוצע: לוח זמנים סדרתי

### לוח זמנים חדש (שעון ישראל)

```text
שעה          | פעולה                    | משך     | Firecrawl?
-------------|--------------------------|---------|----------
03:00        | backfill-property-data    | ~45 דק  | Yes
05:00-07:00  | availability-check       | ~2 שעות | Yes
08:00-08:55  | Yad2 scouts (12 configs) | ~1 שעה  | Yes
09:00-09:25  | Homeless scouts (6)      | ~30 דק  | Yes
10:00        | cleanup-orphan-duplicates | <1 דק   | No
10:30        | cleanup-stuck-runs       | <1 דק   | No
12:00-13:05  | Madlan scouts (14)       | ~1 שעה  | Yes
14:00        | backfill-property-data   | ~45 דק  | Yes
15:00        | cleanup-stuck-runs       | <1 דק   | No
23:00        | trigger-matching         | ~5 דק   | No
```

**עיקרון: אף שני תהליכים שמשתמשים ב-Firecrawl לא חופפים.**

### שינויים ב-Cron Jobs

**מחיקה (1 job):**

| Job | פעולה |
|-----|-------|
| `backfill-entry-dates-job` (14) | מחיקה -- פונקציה לא קיימת |

**שינויים (5 jobs):**

| Job | ישן | חדש | סיבה |
|-----|-----|-----|------|
| `scout-properties-job` (8) | `*/10 * * * *` | `*/5 5-11 * * *` | רץ רק בטווח שעות הסקאוט (05:00-13:59 IL = UTC offset +2/3), כל 5 דק |
| `cleanup-stuck-runs` (10) | `*/5 * * * *` | `30 7,12 * * *` | פעמיים ביום -- אחרי כל חלון סקאוט (10:30, 15:00 IL) |
| `match-leads-job` (12) | `*/15 * * * *` | `0 21 * * *` | פעם ביום ב-23:00 IL (= 21:00 UTC) |
| `availability-check-continuous` (19) | `*/10 * * * *` | `*/10 3-4 * * *` | רק בחלון 05:00-06:50 IL (03:00-04:50 UTC) -- לפני הסקאוטים |
| `cleanup-orphan-duplicates-hourly` (20) | `0 * * * *` | `0 8 * * *` | פעם ביום ב-10:00 IL (08:00 UTC) |
| `backfill-data-completion-job` (16) | `0 1,10 * * *` | `0 1,12 * * *` | 03:00 + 14:00 IL -- אחרי חלונות הסקאוט |

### ביצוע טכני

**שלב 1: מחיקת job מת**
```sql
SELECT cron.unschedule('backfill-entry-dates-job');
```

**שלב 2: עדכון 6 jobs**
מחיקת הישנים + יצירת חדשים עם schedules מעודכנים.

לפני כל `cron.schedule` חדש, קודם `cron.unschedule` את הישן כדי למנוע כפילויות.

**שלב 3: עדכון availability-check**
שינוי מ-`*/10` ל-`*/10 3-4 * * *` (רק UTC 03:00-04:50 = IL 05:00-06:50).
הבדיקה תעבד ~70 נכסים לחלון (7 ריצות x 3 batches x ~3.3). עם ~5,339 נכסים ו-recheck כל 7 ימים, צריך ~760/יום, מה שיספיק בחלון 2 שעות.

אם לא מספיק -- אפשר להוסיף חלון שני 16:00-17:00 IL (אחרי backfill).

**שלב 4: בדיקה**
- לוודא שכל ה-cron jobs מעודכנים ב-`cron.job`
- לצפות בלוגים ב-24 השעות הראשונות לוודא שאין חפיפות

### קבצים מושפעים

| קובץ | סוג שינוי |
|---|---|
| SQL (cron.job) | מחיקת 1 job, עדכון 5 jobs |
| אין שינוי בקוד Edge Functions | הלוגיקה נשארת, רק ה-schedule משתנה |

### סיכונים

- **Availability check**: חלון קצר יותר = פחות נכסים נבדקים ביום. אם 70/חלון לא מספיק, נוסיף חלון שני.
- **Cleanup-stuck-runs**: פעמיים ביום במקום כל 5 דק. אם ריצה נתקעת בבוקר, תחכה עד 10:30 IL. כל הפונקציות כבר מטפלות ב-stuck runs בעצמן (locks של 10-15 דקות).
- **UTC vs IL**: ישראל היא UTC+2 (חורף) / UTC+3 (קיץ). ה-cron רץ ב-UTC. הזמנים מחושבים ל-UTC+2 (חורף). בקיץ הכל יזוז שעה קדימה.

