
# תיקון בדיקת זמינות 2 (Jina) + סקירת כפילויות והתאמות

## בעיה 1: בדיקת זמינות 2 (Jina) - Kill Switch שגוי (קריטי)

**הסיבה**: בקובץ `trigger-availability-check-jina/index.ts` שורה 35, הפונקציה בודקת את הדגל `process_availability` (שכבוי!) במקום `process_availability_jina` (שדלוק). כל ריצת cron נחסמת כי היא חושבת שהתהליך כבוי.

**התיקון**: שינוי שורה 35 מ-`'availability'` ל-`'availability_jina'`:
```typescript
// לפני (שגוי):
if (!isManual && !continue_run && !await isProcessEnabled(supabase, 'availability')) {
// אחרי (נכון):
if (!isManual && !continue_run && !await isProcessEnabled(supabase, 'availability_jina')) {
```

## בעיה 2: ריצת זמינות תקועה

ריצה `5e626233` בסטטוס `running` עם רק 2 נכסים שנבדקו. חוסמת ריצות חדשות.

**התיקון**: מיגרציה לסגירת הריצה:
```sql
UPDATE availability_check_runs
SET status = 'stopped', completed_at = now()
WHERE id = '5e626233-e942-4329-94aa-79ec1a77043a'
AND status = 'running';
```

## סקירת כפילויות - תקין

- הריצה האחרונה (23/02 01:00) הושלמה בהצלחה
- 0 כפילויות נמצאו (רוב הנכסים כבר נבדקו - 5,404 מתוך 5,636)
- 232 נותרו לבדיקה - יטופלו בריצה הבאה
- **אין בעיה**

## סקירת התאמות - לא רצו כמעט חודש

- הריצה האחרונה: **29 בינואר** (לפני ~25 יום)
- נמצאה התאמה אחת מתוך 16 לידים
- הcron פעיל ורץ כל יום ב-07:00, אז ייתכן שהריצות מתבצעות אבל אין לידים eligible חדשים
- ייתכן גם שהcron קורא לפונקציה אחרת (trigger-matching) ולא ישירות ל-personal-scout
- **צריך לבדוק**: האם ריצות matching אחרונות מסתיימות מהר בלי לידים, או שלא רצות בכלל

## סיכום שינויים

1. **קובץ**: `supabase/functions/trigger-availability-check-jina/index.ts` - תיקון kill switch מ-`availability` ל-`availability_jina`
2. **מיגרציה**: סגירת ריצת זמינות תקועה `5e626233`
3. **פריסה**: deploy של `trigger-availability-check-jina`

## מה לא ישתנה
- אף שינוי בסריקות
- כפילויות והתאמות לא נדרשים תיקון קוד כרגע
