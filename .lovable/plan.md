

## הבעיה
ה-Edge Function `backfill-property-data-jina` מסנן את ה-query כך שיביא רק נכסים עם `backfill_status` של `null` או `pending`. נכסים שנכשלו פעם אחת מקבלים `backfill_status = 'failed'` ולכן **לא חוזרים לתור לעולם** עד שמאפסים אותם ידנית.

ה-713 שאתה רואה הם נכסים שנכשלו בריצות קודמות (יד2 חסום ע"י WAF, נכסים שכבר לא קיימים, וכו'). זו לוגיקה מכוונת — לא לבזבז קריאות API על נכסים שבטוח ייכשלו שוב — אבל אין דרך נוחה לאפס אותם מה-UI.

יש כבר API להפעלה ידנית של reset (`action: 'reset'` עם `source`), הוא פשוט לא חשוף ב-UI.

## הפתרון המוצע
להוסיף **כפתור "נסה שוב נכסים שנכשלו" (Retry Failed)** בכרטיסיית "השלמת נתונים" בעמוד סקאוט נדל"ן.

### 1. UI — כפתור חדש בכרטיסיה
הוספת כפתור משני (outline) ליד כפתור ההפעלה הקיים, עם:
- אייקון `RotateCcw`
- טקסט: "נסה שוב נכשלים (713)" — עם הספירה הדינמית
- ConfirmDialog לפני ההפעלה ("האם לאפס 713 נכסים שנכשלו ולנסות שוב?")
- אחרי אישור: קריאה ל-Edge Function עם `action: 'reset'` ואז הפעלת ה-backfill הרגיל

### 2. Hook — `useBackfillProgressJina.ts`
הוספת mutation חדשה `retryFailed()` שעושה:
1. קריאה ל-`backfill-property-data-jina` עם `{ action: 'reset', source: 'all' }` (או לפי מקור נבחר)
2. ברגע שמסיים — קריאה ל-`start` הרגיל

### 3. ספירה דינמית
שאילתה קלה ל-Supabase (`select count from scouted_properties where backfill_status='failed'`) כדי להציג את המספר על הכפתור — ולהסתיר אותו אם 0.

### 4. תמיכה ב-`action: 'reset'` בלי `source` ספציפי
לבדוק אם הפונקציה הקיימת תומכת ב-reset לכל המקורות בבת אחת. אם לא — להוסיף תמיכה (לולאה על שלושת המקורות) או לאפשר שדה `reset_all: true`.

## טכני
- קובץ עיקרי: `src/components/PropertyScout/BackfillJinaCard.tsx` (או הקומפוננטה הקיימת — אאתר אותה)
- Hook: `src/hooks/useBackfillProgressJina.ts`
- Edge Function: `supabase/functions/backfill-property-data-jina/index.ts` — רק וידוא שה-`reset` action תומך ב"כל המקורות"

## היקף
שינוי קטן-בינוני: כפתור חדש + mutation + שאילתת ספירה. ללא מיגרציות DB.

