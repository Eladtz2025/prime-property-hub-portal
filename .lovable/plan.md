
# תיקון ריצות השלמת נתונים ובדיקת זמינות

## בעיות שנמצאו

### בעיה 1: השלמת נתונים (Backfill) לא רצה כבר 11 ימים!

**שורש הבעיה:** יש UNIQUE constraint על עמודת `task_name` בטבלת `backfill_progress`. הריצה האחרונה מ-2 בפברואר נשמרה עם `task_name = 'data_completion'` בסטטוס `stopped`. כל ניסיון של ה-cron ליצור ריצה חדשה (INSERT) נכשל בשקט בגלל הכפילות. **4,511 נכסים ממתינים להשלמת נתונים.**

הנה מה שקורה:
1. Cron שולח בקשה ב-03:00 (ישראל)
2. הפונקציה מנסה INSERT עם `task_name = 'data_completion'`
3. UNIQUE constraint חוסם את ה-INSERT
4. הפונקציה זורקת שגיאה ולא מעבדת שום דבר

**פתרון:** לפני יצירת ריצה חדשה, למחוק רשומות ישנות (completed/stopped/failed) עם אותו task_name. זה ישחרר את ה-UNIQUE constraint.

### בעיה 2: בדיקת זמינות רצה פעם אחת ביום ובודקת רק 18 נכסים

**שורש הבעיה:** ה-cron מוגדר כ-`0 3 * * *` (פעם אחת ביום ב-03:00 UTC). הפונקציה מעבדת מקסימום 3 batches של 6 = **18 נכסים**. אתמול ה-cron רץ כל 10 דקות (כנראה הוגדר ידנית מהדשבורד), אבל היום הוא חזר לריצה יחידה.

עם 997 נכסים שמעולם לא נבדקו + rechecks, 18 נכסים ביום זה כלום.

**פתרון:** לשנות את הפונקציה כך שתשרשר את עצמה (self-chain) כל עוד יש עוד נכסים לבדוק ולא חרגה מהמגבלה היומית, במקום להסתמך על ה-cron לטריגור חוזר. הקוד כבר אומר "cron will continue in 10 minutes" אבל ה-cron לא באמת חוזר.

---

## שינויים מתוכננים

### קובץ 1: `supabase/functions/backfill-property-data/index.ts`

**תיקון:** לפני INSERT של ריצה חדשה, למחוק רשומות ישנות שכבר הסתיימו:

```typescript
// Before creating new task, delete old completed/stopped/failed records 
// to avoid UNIQUE constraint violation on task_name
const taskName = auto_trigger ? `${TASK_NAME}_auto_${source_filter || 'all'}` : TASK_NAME;

await supabase
  .from('backfill_progress')
  .delete()
  .eq('task_name', taskName)
  .in('status', ['completed', 'stopped', 'failed']);

const { data: newTask, error: insertError } = await supabase
  .from('backfill_progress')
  .insert({ task_name: taskName, status: 'running', ... })
  .select()
  .single();
```

### קובץ 2: `supabase/functions/trigger-availability-check/index.ts`

**תיקון:** הוספת self-chaining - אחרי שהריצה מסתיימת ויש עוד נכסים בתור, הפונקציה תטריגר את עצמה שוב (עם השהייה של כמה שניות):

```typescript
// After processing batches, if there are remaining items and daily quota left
if (remainingBatches > 0 && (remainingQuota - processedThisRun) > 0) {
  console.log(`🔄 Self-chaining: ${remainingBatches} batches remaining`);
  // Fire-and-forget trigger of next run
  fetch(`${supabaseUrl}/functions/v1/trigger-availability-check`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ continue_run: true })
  }).catch(err => console.error('Self-chain failed:', err));
}
```

---

## סיכום

| קובץ | בעיה | תיקון |
|---|---|---|
| `backfill-property-data/index.ts` | UNIQUE constraint חוסם ריצות חדשות | מחיקת רשומות ישנות לפני INSERT |
| `trigger-availability-check/index.ts` | Cron רץ פעם אחת, בודק רק 18 | Self-chaining להמשך אוטומטי עד גמר התור/הקווטה |

**תוצאה צפויה:**
- השלמת נתונים תחזור לעבוד אוטומטית ותעבד את 4,511 הנכסים הממתינים
- בדיקת זמינות תמשיך אוטומטית עד שתגיע למגבלה היומית (2,500) במקום לעצור אחרי 18
