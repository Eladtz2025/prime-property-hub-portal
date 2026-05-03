## הבעיה
ה-worker מחזיר `queue_empty` למרות שיש 304 נכסים פרטיים זמינים. הסיבה: filter פגום ב-PostgREST:
```
.not('phone_extraction_status', 'eq', 'success')
```
מתורגם ל-`status != 'success'` שמחזיר `NULL` (לא `true`) עבור שורות שבהן `status IS NULL` — כלומר כל הנכסים שעדיין לא נוסו מסוננים החוצה.

## התיקון (קובץ אחד, שורה אחת)
`supabase/functions/phone-extraction-worker/index.ts` — שורה 77:

**במקום:**
```ts
.not('phone_extraction_status', 'eq', 'success')
```

**להחליף ב:**
```ts
.or('phone_extraction_status.is.null,and(phone_extraction_status.neq.success,phone_extraction_status.neq.not_found)')
```

זה תופס גם NULL וגם כל סטטוס שאינו `success`/`not_found`.

## אימות אחרי
- ללחוץ "הרץ עכשיו" בכרטיס "חילוץ טלפונים" → אמור להופיע ריצה ראשונה (לא `queue_empty`).
- לבדוק ש"בתור" יורד מ-304.

## אפס סיכון
- שינוי בקובץ edge function אחד בלבד.
- לא נוגעים ב-DB, ב-cron, או בקבצים אחרים.
- אם משהו לא טוב — מכבים את ה-toggle מה-UI.
