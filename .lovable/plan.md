

# תיקון כפתור "הפעל" בהשלמת נתונים 2 (Jina)

## בעיות שנמצאו

### 1. כפתור "הפעל" תקוע במצב טעינה עד סוף ה-batch (קריטי)

כשלוחצים "הפעל", ה-edge function יוצרת את הרשומה ב-DB **ואז מעבדת את כל ה-batch** (5 נכסים x עד 35 שניות כל אחד) **לפני שהיא מחזירה תשובה**. כלומר הכפתור נשאר בסטטוס "טעינה" 2-3 דקות.

ה-hook מחכה ל-`onSuccess` כדי להגדיר `isRunning=true` ולהתחיל polling, אבל ה-`onSuccess` מופעל רק אחרי שה-batch מסתיים.

**תיקון**: בקובץ `src/hooks/useBackfillProgressJina.ts` - לשנות את `startMutation` לשיטת fire-and-forget. במקום לחכות לתשובה, לשלוח את הבקשה ומיד להתחיל polling:

```typescript
const startMutation = useMutation({
  mutationFn: async () => {
    toast.info('מתחיל השלמת נתונים (Jina)...', { duration: 3000 });
    // Fire-and-forget - don't await the full batch
    supabase.functions.invoke('backfill-property-data-jina', {
      body: { action: 'start', dry_run: false }
    }).catch(err => console.error('Backfill Jina error:', err));
    // Return immediately
    return { fired: true };
  },
  onSuccess: () => {
    setIsRunning(true);
    // Small delay then start polling for the new task
    setTimeout(() => refetchProgress(), 2000);
  },
  ...
});
```

### 2. Polling לא מתחיל כי ה-query הראשוני מוצא רשומה ישנה (בינוני)

ה-query מחפש את הרשומה האחרונה עם `task_name = 'data_completion_jina'`. אבל ה-edge function **מוחקת** רשומות ישנות (completed/stopped/failed) לפני שיוצרת חדשה. כלומר אחרי לחיצה על "הפעל":
- הרשומה הישנה נמחקת
- הרשומה החדשה נוצרת עם status=running
- אבל ה-hook עדיין לא יודע מזה כי `isRunning=false` ואין `refetchInterval`

**תיקון**: ב-`onSuccess` של ה-mutation, להפעיל `setIsRunning(true)` מיד ולהתחיל polling עם delay קצר (2 שניות) כדי לתת ל-edge function זמן ליצור את הרשומה.

### 3. גם useBackfillProgress (מקורי) סובל מאותה בעיה

אותו דפוס בדיוק קיים גם ב-`useBackfillProgress.ts`. צריך לתקן את שניהם.

## שינויים נדרשים

### קובץ 1: `src/hooks/useBackfillProgressJina.ts`

שינוי ה-`startMutation` לשיטת fire-and-forget:
- שליחת הבקשה בלי `await` על התשובה
- הגדרת `isRunning=true` מיד ב-`onSuccess`
- `setTimeout(() => refetchProgress(), 2000)` כדי לתפוס את הרשומה החדשה
- הוספת error handling ל-fire-and-forget

### קובץ 2: `src/hooks/useBackfillProgress.ts`

אותו תיקון בדיוק.

## תוצאה צפויה

- לחיצה על "הפעל" -> הכפתור חוזר למצב רגיל תוך שנייה
- תוך 2 שניות ה-polling מתחיל ומציג את הסטטוס והפרוגרס
- אין יותר "תקיעה" של 2-3 דקות על הכפתור

