
# תיקון כרטיסיית "ריצות אחרונות" -- 3 באגים

## באג 1: התאמות לא מוצגות (קריטי)

הקוד שולף התאמות מטבלת `personal_scout_runs` שהיא ריקה לגמרי, בעוד שנתוני ההתאמות נמצאים בטבלת `scout_runs` עם `source = 'matching'`. בנוסף, הקוד במפורש מסנן החוצה `matching` מה-query של scout_runs (שורה 118: `.neq('source', 'matching')`).

**תיקון:** הוספת query חמישי שמושך מ-`scout_runs` WHERE `source = 'matching'`, והצגתו כ"התאמה ללקוחות" עם `leads_matched` ו-`properties_found`.

## באג 2: השלמת נתונים שתקועה

יש ריצת `data_completion_auto_madlan` שהתחילה אתמול ב-21:48 UTC ועדיין בסטטוס `running` (לא הסתיימה). זה גורם לה להופיע כ"רץ..." בכרטיס. בנוסף, ה-Cron של ההשלמת נתונים לא סונכרן ולכן רץ בשעה 03:00 ישראל במקום 00:00.

**פעולה נדרשת:** עדכון ה-Cron (SQL שניתן קודם), וסגירת הריצה התקועה.

## באג 3: כפילויות -- בעיית cron

הכפילויות רצו ב-21:49 שעון ישראל (19:49 UTC) במקום 03:00 שעון ישראל. זה בגלל ה-Cron שלא סונכרן. הנתונים עצמם נמשכים נכון מ-`backfill_progress`, אבל ברגע שה-Cron יעודכן, הכפילויות ירוצו בשעה הנכונה.

## שינויים טכניים

### קובץ: `src/components/scout/ScheduleSummaryCard.tsx`

1. הוספת query נפרד ל-`scout_runs` WHERE `source = 'matching'` (במקום `personal_scout_runs`)
2. הסרת ה-query ל-`personal_scout_runs` (טבלה ריקה ולא רלוונטית)
3. עיבוד נתוני ההתאמות מתוך `scout_runs`: הצגת `properties_found` (נכסים שנבדקו) ו-`leads_matched` (התאמות שנמצאו)
4. שינוי הסיכום להציג: `"X נבדקו, Y התאמות"` במקום `"X התאמות, Y לידים"`

### פעולה ידנית נדרשת (SQL)

עדכון שעות ה-Cron (כפי שניתן בהודעה הקודמת):
```sql
UPDATE cron.job SET schedule = '0 22 * * *' WHERE jobname = 'backfill-data-completion-job';
UPDATE cron.job SET schedule = '0 1 * * *' WHERE jobname = 'cleanup-orphan-duplicates-hourly';
UPDATE cron.job SET schedule = '0 5 * * *' WHERE jobname = 'match-leads-job';
```

סגירת ריצות תקועות:
```sql
UPDATE backfill_progress SET status = 'stopped', completed_at = now(), error_message = 'manually stopped - stuck'
WHERE status = 'running' AND started_at < now() - interval '6 hours';
```
