
# תיקון שורש הבעיה: ריצות תקועות בסטטוס "running"

## הבעיה

הפונקציה `checkAndFinalizeRun` בקובץ המשותף `run-helpers.ts` (שורות 133 ו-151) מנסה לקרוא את העמודה `created_at` מטבלת `scout_runs` - אבל העמודה הזו לא קיימת. העמודה הנכונה היא `started_at`.

זה גורם לשאילתת Supabase להיכשל בשקט (שגיאת 400 מ-PostgREST), כך ש-`run` מוחזר כ-null, והפונקציה יוצאת מוקדם בשורה 137 בלי לסגור את הריצה לעולם.

**זו הסיבה שריצות נתקעות ב-running** - הן מסיימות לסרוק את כל הדפים, אבל הפונקציה שאמורה לעדכן את הסטטוס ל-completed/partial נכשלת לפני שהיא מגיעה לעדכון.

### מידע מהריצה הנוכחית
- ריצה `0e6efdc3`: כל 10 הדפים בסטטוס `completed`, אבל הריצה עצמה עדיין `running`
- הבעיה משפיעה על **כל** הסורקים (מדלן, יד2, הומלס) כי כולם משתמשים באותו helper משותף

## התיקון

### קובץ: `supabase/functions/_shared/run-helpers.ts`

**שורה 133** - שינוי `created_at` ל-`started_at` ב-select:
```
.select('page_stats, status, config_id, properties_found, new_properties, started_at')
```

**שורה 151** - שינוי `created_at` ל-`started_at` בחישוב:
```
const runAgeMs = Date.now() - new Date(run.started_at).getTime();
```

### ניקוי הריצה התקועה
עדכון ריצה `0e6efdc3` מ-`running` ל-`completed` (כל 10 דפים הסתיימו בהצלחה).

### פריסה מחדש
כל הפונקציות שמשתמשות ב-`run-helpers.ts`:
- `scout-madlan-jina`
- `scout-yad2-jina`
- `scout-homeless-jina`

