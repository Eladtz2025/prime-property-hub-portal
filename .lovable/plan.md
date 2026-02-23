

# תיקון כפילויות - ריצה ידנית נעצרת + כפתור עצירה חסר

## בעיות שנמצאו

### 1. ריצה ידנית עדיין נעצרת בגלל end_time (קריטי)

התיקון הקודם הוסיף `isManualRun` שמבוסס על `body.reset === true`. אבל כשהפונקציה עושה self-chain אחרי 10 באצ'ים, היא שולחת `{ continuation: true }` בלבד - בלי `reset: true`. לכן ב-continuation, `isManualRun` הוא `false` והבדיקה של `endTimeReached` עוצרת את הריצה.

**תוצאה בריצה האחרונה**: 5,252 מתוך 5,632 עובדו, 380 נדלגו, סטטוס "stopped" עם "end_time_reached".

**תיקון**: להעביר `manual: true` ב-self-chain כשהריצה המקורית היתה ידנית, ולזהות את זה בתחילת הפונקציה.

```typescript
// בתחילת הפונקציה:
const isManualRun = isReset || body.manual === true;

// ב-self-chain (שורה 243):
body: JSON.stringify({ continuation: true, manual: isManualRun }),
```

### 2. אין כפתור "עצור" לכפילויות

ה-ProcessCard של כפילויות לא מקבל `onStop`, כך שכשהתהליך רץ אין אפשרות לעצור אותו. צריך להוסיף mutation שמעדכן את הסטטוס ל-stopped.

**תיקון**: הוספת `stopDedup` mutation ב-ChecksDashboard שמעדכן את ה-backfill_progress ל-stopped, והעברתו כ-`onStop` ל-ProcessCard.

### 3. סטטוס "stopped" לא מוצג ככרטיס

שורה 570 - ה-status prop לא מזהה "stopped", כך שהכרטיס מראה idle במקום מצב מתאים.

**תיקון**: להוסיף בדיקה ל-stopped (נשתמש ב-completed כי "נעצר בהצלחה").

## שינויים נדרשים

### קובץ 1: `supabase/functions/detect-duplicates/index.ts`
- שורה 31: שינוי `isManualRun` לכלול גם `body.manual === true`
- שורה 243: הוספת `manual: isManualRun` ל-self-chain body

### קובץ 2: `src/components/scout/ChecksDashboard.tsx`
- הוספת `stopDedup` mutation שמעדכן backfill_progress ל-stopped
- שורה 570: הוספת זיהוי "stopped" ב-status prop
- שורה 576: הוספת `onStop` ו-`isStopPending` ל-ProcessCard

## סדר ביצוע
1. תיקון edge function + deploy
2. תיקון frontend

## פריסה
- `detect-duplicates`

## תוצאה צפויה
- ריצה ידנית תמשיך דרך כל ה-continuations בלי להיעצר
- כפתור "עצור" יופיע כשהתהליך רץ
- סטטוס "נעצר" יוצג נכון בכרטיס

