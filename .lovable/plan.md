
# תיקון: ריצה ידנית נחסמת על ידי lock של ריצה מקבילה

## הבעיה

כשלוחצים "הפעל ריצה עכשיו", לפעמים עולים שני instances במקביל (retry של Supabase, double-click, וכו'). ה-instance בלי `manual: true` תופס את ה-lock ורץ כ-cron-based, נעצר ב-`schedule_end_time`. ה-instance הידני נחסם ומחזיר "Already running".

## הפתרון

שני שינויים קטנים:

### 1. שמירת דגל `manual` בטבלת `availability_check_runs`

הוספת עמודה `is_manual` (boolean, default false) לטבלה. כשיוצרים ריצה, רושמים אם היא ידנית.

### 2. עדכון לוגיקת ה-lock בפונקציה

כשריצה ידנית מגיעה ומוצאת lock פעיל:
- אם ה-lock הוא של ריצה **לא ידנית** (cron) -- הריצה הידנית "מחליפה" אותה: מעדכנת את הרשומה ל-`is_manual = true` וממשיכה
- אם ה-lock הוא של ריצה **ידנית** אחרת -- מחזירה "Already running" כרגיל

בנוסף, בשלב ה-self-chain, הבדיקה של `endTimeReached` תשתמש ב-`is_manual` מהדאטאבייס (לא רק מה-body) כדי להבטיח עקביות.

## פרטים טכניים

### מיגרציה: הוספת עמודה `is_manual`

```sql
ALTER TABLE availability_check_runs 
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;
```

### קובץ: `supabase/functions/trigger-availability-check/index.ts`

**שינוי 1 - Lock check (שורות ~43-60):**

לפני:
```text
if (runningCheck) {
  return "Already running"
}
```

אחרי:
```text
if (runningCheck) {
  if (isManual && !runningCheck.is_manual) {
    // Manual overrides cron: update the existing run to manual
    await supabase.from('availability_check_runs')
      .update({ is_manual: true })
      .eq('id', runningCheck.id);
    return "Upgraded existing run to manual"
  }
  return "Already running"
}
```

**שינוי 2 - יצירת ריצה חדשה (שורה ~68):**

```text
.insert({ status: 'running', is_manual: isManual })
```

**שינוי 3 - בדיקת end time (שורות ~259-268):**

במקום לבדוק רק `isManual` מה-body, גם לבדוק `is_manual` מהדאטאבייס:

```text
// Check if run was upgraded to manual by another invocation
const { data: currentRun } = await supabase
  .from('availability_check_runs')
  .select('is_manual')
  .eq('id', runId)
  .single();

const effectiveManual = isManual || currentRun?.is_manual === true;

if (!effectiveManual) {
  // check isPastEndTime...
}
```

## סיכום

- 1 מיגרציה (הוספת עמודה)
- 1 קובץ Edge Function לעריכה
- ריצה ידנית תמיד תעבוד -- גם אם cron רץ במקביל
