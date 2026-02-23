
# QA כפילויות - בעיות ותיקונים

## בעיות שנמצאו

### 1. ריצה ידנית נעצרת אחרי 10 באצ'ים בגלל schedule_end_time (קריטי)

הפעלת עכשיו את הכפילויות ב-19:10 שעון ישראל, אבל ה-`schedule_end_time` מוגדר ל-04:30. הפונקציה בודקת `isPastEndTime` אחרי 10 באצ'ים, ומכיוון ש-19:10 > 04:30, היא עוצרת מיד.

**תוצאה**: רק 5,000 מתוך 5,632 נכסים נבדקו. 632 נשארו בלי בדיקה.

**תיקון**: ב-`detect-duplicates/index.ts` — להעביר את הפרמטר `reset` (שמסמן ריצה ידנית) לבדיקת ה-end time, ולדלג על הבדיקה כשמדובר בריצה ידנית. נשמור משתנה `isManualRun` בתחילת הפונקציה ונשתמש בו בתנאי.

```typescript
// שורה ~28: שמירת המשתנה
const isManualRun = body.reset === true;

// שורה ~202: דילוג על end_time לריצות ידניות
if (endTimeReached && !isManualRun) {
```

### 2. כפתור "הפעל" תקוע (אותה בעיה כמו backfill)

ה-`triggerDedup` mutation ב-ChecksDashboard.tsx עושה `await` על `supabase.functions.invoke`, ומכיוון שה-edge function מעבדת את כל הנתונים לפני שהיא מחזירה תשובה (6 שניות כאן, אבל יכול להיות יותר), הכפתור נשאר בסטטוס טעינה.

**תיקון**: לשנות ל-fire-and-forget בדיוק כמו שעשינו ב-backfill.

```typescript
const triggerDedup = useMutation({
  mutationFn: async () => {
    supabase.functions.invoke('detect-duplicates', {
      body: { reset: true }
    }).catch(err => console.error('Dedup trigger error:', err));
    return { fired: true };
  },
  onSuccess: () => {
    toast.success('בדיקת כפילויות הופעלה');
    queryClient.invalidateQueries({ queryKey: ['dedup-stats-summary'] });
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['dedup-run-history'] });
      queryClient.invalidateQueries({ queryKey: ['dedup-live-stats'] });
    }, 2000);
  },
  ...
});
```

### 3. סטטוס "stopped" לא מתורגם ב-UI (נמוך)

ב-DeduplicationStatus.tsx, שורות 164 ו-204-208, הסטטוס "stopped" נופל ל-else ומציג את הטקסט הגולמי. צריך להוסיף טיפול ב-"stopped".

**תיקון**: בשני המקומות בקובץ, להוסיף תנאי ל-"stopped":

```typescript
// שורה 164-165: Badge בריצה אחרונה
lastRun.status === 'completed' ? 'הושלם' 
  : lastRun.status === 'stopped' ? 'נעצר'
  : lastRun.status

// שורות 204-208: Badge בטבלת היסטוריה  
: run.status === 'stopped'
? <Badge className="bg-yellow-100 ...">נעצר</Badge>
```

### 4. סטטוס כרטיס הכפילויות לא מזהה "stopped" (נמוך)

שורה 567 ב-ChecksDashboard — ה-`status` prop של ProcessCard בודק רק "running" ו-"completed", אבל לא "stopped". כשהסטטוס הוא "stopped" הוא נופל ל-idle, שזה לא מדויק.

**תיקון**: להוסיף טיפול ב-"stopped" גם שם.

## שינויים נדרשים

### קובץ 1: `supabase/functions/detect-duplicates/index.ts`
- הוספת `isManualRun` משתנה בתחילת הפונקציה
- שינוי התנאי בשורה ~202 לדלג על end_time בריצה ידנית

### קובץ 2: `src/components/scout/ChecksDashboard.tsx`
- שינוי `triggerDedup` mutation ל-fire-and-forget
- תיקון status ב-ProcessCard ל-"stopped"

### קובץ 3: `src/components/scout/checks/DeduplicationStatus.tsx`
- הוספת Badge ל-"stopped" בשורה 164
- הוספת Badge ל-"stopped" בטבלת היסטוריה (שורה 208)

## פריסה
- `detect-duplicates`

## תוצאה צפויה
- ריצה ידנית תעבד את כל הנכסים ללא הגבלת שעה
- כפתור "הפעל" יחזור למצב רגיל מיד
- סטטוס "נעצר" יוצג בעברית נכונה
