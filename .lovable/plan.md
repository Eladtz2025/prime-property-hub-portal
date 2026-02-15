
# תיקון מקיף: בדיקת זמינות - 3 באגים שנמצאו

## הבעיות שזיהיתי

### באג 1: כפתור "הפעל" בממשק לא שולח `manual: true`
**זו הבעיה הכי חשובה.** בשורה 228 ב-ChecksDashboard.tsx:
```text
supabase.functions.invoke('trigger-availability-check')
// ^ אין body עם manual: true!
```
כשאתה לוחץ "הפעל" בממשק, הריצה נרשמת כ-`is_manual: false` (כאילו cron), ולכן היא נעצרת ב-`schedule_end_time` (06:30 ישראל). **זו הסיבה שהריצה נעצרה אחרי 18 נכסים בפעם הקודמת.**

### באג 2: כפתור "עצור" לא עובד בגלל race condition
הפונקציה מעדכנת את הריצה ל-`status: completed` (שורה 257) **לפני** שהיא מחליטה אם לעשות self-chain (שורה 294). כפתור העצירה מחפש `WHERE status = 'running'`, אבל הסטטוס כבר `completed`, אז העצירה לא תופסת והריצה ממשיכה.

### באג 3: Self-chain לא בודק אם עצרו אותו
גם אם העצירה הצליחה לתפוס את הריצה, ה-self-chain החדש לא יודע על כך ויוצר ריצה חדשה.

## הפתרון

### קובץ 1: `src/components/scout/ChecksDashboard.tsx`

**תיקון triggerAvailability (שורה 228):**
```typescript
const { data, error } = await supabase.functions.invoke(
  'trigger-availability-check',
  { body: { manual: true } }
);
```

**תיקון stopAvailability (שורות 241-247):**
במקום לעדכן רק `status = 'running'`, גם לעדכן `status = 'completed'` (כדי לתפוס ריצות שכבר סיימו אבל עומדות לעשות self-chain):
```typescript
// Stop: update both running AND completed runs (to prevent self-chain)
const { error: e1 } = await supabase
  .from('availability_check_runs')
  .update({ status: 'stopped', completed_at: new Date().toISOString() })
  .eq('status', 'running');

const { error: e2 } = await supabase
  .from('availability_check_runs')
  .update({ status: 'stopped' })
  .eq('status', 'completed')
  .is('completed_at', null); // safety: only recent ones
```

### קובץ 2: `supabase/functions/trigger-availability-check/index.ts`

**תיקון Self-chain (לפני שורה 298):**
לפני ביצוע self-chain, לבדוק מה הסטטוס הנוכחי בדאטאבייס:
```typescript
// Before self-chaining, check if run was stopped by user
const { data: runStatus } = await supabase
  .from('availability_check_runs')
  .select('status')
  .eq('id', runId)
  .single();

if (runStatus?.status === 'stopped') {
  console.log('🛑 Run was stopped by user, not self-chaining');
  // Don't self-chain
} else if (remainingBatches > 0 && remainingDailyQuota > 0 && !endTimeReached) {
  // Self-chain...
}
```

**שינוי סדר: לא לסמן completed לפני self-chain decision:**
להזיז את העדכון ל-`completed` לאחרי ההחלטה על self-chain. ככה כפתור "עצור" תמיד יתפוס ריצה `running`.

## סיכום השינויים

| קובץ | שינוי | סיבה |
|-------|--------|-------|
| ChecksDashboard.tsx | הוספת `{ body: { manual: true } }` | ריצה ידנית תזוהה נכון |
| ChecksDashboard.tsx | עדכון לוגיקת עצירה | עצירה תתפוס גם ריצות שסיימו |
| trigger-availability-check | בדיקת status לפני self-chain | עצירה תעבוד |
| trigger-availability-check | הזזת completed לאחרי self-chain | race condition |

- 2 קבצים לעריכה
- 0 מיגרציות
- פתרון 3 באגים קריטיים בבת אחת
