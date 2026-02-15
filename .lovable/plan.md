

# תיקון: הפעלה ידנית של בדיקת זמינות תדלג על schedule_end_time

## הבעיה

כשלוחצים "הפעל ריצה עכשיו" בממשק, הפונקציה `trigger-availability-check` מעבדת עד 3 באצ'ים ואז בודקת את `schedule_end_time`. אם השעה עברה את 06:30 (שעת הסיום המוגדרת), היא עוצרת ולא משרשרת ריצה נוספת -- גם אם ההפעלה הייתה ידנית.

## הפתרון

העברת פרמטר `manual: true` מה-UI לפונקציה, כך שהשרשור העצמי ידלג על בדיקת שעת הסיום.

## פרטים טכניים

### קובץ 1: `src/components/scout/availability/AvailabilityActions.tsx`
- שורה 26: הוספת `body: { manual: true }` לקריאת `supabase.functions.invoke('trigger-availability-check')`

### קובץ 2: `supabase/functions/trigger-availability-check/index.ts`
- שורה ~30: קריאת `manual` מה-body של הבקשה (`const { manual, continue_run } = await req.json().catch(() => ({}))`)
- שורה ~254-263: בבדיקת `endTimeReached` -- דילוג אם `manual` או `continue_run` עם `manual`:
  - אם `manual === true`, לא בודקים `isPastEndTime` ו-`endTimeReached` נשאר `false`
- שורה ~273: העברת `manual: true` גם בשרשור העצמי כדי שכל הבאצ'ים הבאים ידלגו גם הם על בדיקת שעת הסיום

### לוגיקת השינוי בפונקציה

```text
בקשה נכנסת
  --> קריאת body: { manual?, continue_run? }
  ...
  --> אחרי עיבוד הבאצ'ים:
      אם manual == true:
        endTimeReached = false  (דילוג על בדיקה)
      אחרת:
        בדיקה רגילה של isPastEndTime
  --> בשרשור עצמי:
      body: { continue_run: true, manual: manual }  (שמירה על הדגל)
```

שינוי מינימלי -- שני קבצים, 4 שורות.

