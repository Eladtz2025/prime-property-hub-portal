

## הטמעת מערכת WhatsApp בטבלאות — כמו סטודיו הצילום

### הרעיון
במקום לגשת לטאב "ווטסאפ" נפרד ב-MarketingHub, כפתור ה-WhatsApp בכל טבלה (לקוחות / נכסים / דירות שנמצאו) יפתח דיאלוג שליחה מלא עם תבניות, עריכת הודעה, והיסטוריית צ'אט — ישירות מהשורה.

### מה ייבנה

**1. קומפוננטה חדשה: `WhatsAppSendDialog.tsx`**
דיאלוג קומפקטי שמקבל props:
- `phone`, `name` — הנמען
- `context` — הקשר אופציונלי (כתובת נכס, פרטי חיפוש לקוח)
- `open` / `onOpenChange`

הדיאלוג יכיל:
- שם הנמען + טלפון בכותרת
- בחירת תבנית (Popover עם עיפרון לעריכה — אותו מנגנון שקיים)
- Textarea לעריכת ההודעה עם placeholders
- כפתור שליחה דרך Green API (useWhatsAppSender)
- כפתור היסטוריית צ'אט (אותו דיאלוג צ'אט שקיים)

**2. הטמעה בטבלת לקוחות (`ExpandableCustomerRow.tsx` + `CustomerMobileTable.tsx`)**
כפתור ה-WhatsApp הקיים (שכרגע פותח wa.me) → יפתח את `WhatsAppSendDialog` עם שם הלקוח, טלפון, ופרטי חיפוש כהקשר.

**3. הטמעה בטבלת נכסים**
כפתור WhatsApp ליד בעל הנכס → יפתח דיאלוג עם שם הבעלים, טלפון, וכתובת הנכס.

**4. הטמעה בטבלת דירות שנמצאו (`ScoutedPropertiesTable.tsx`)**
כפתור WhatsApp קיים (שמשמש להתאמת לקוחות) → נוסיף כפתור נפרד שפותח את הדיאלוג לשליחת הודעה ידנית על הדירה.

**5. טאב ווטסאפ ב-MarketingHub — נשאר**
הטאב נשאר לשליחה בצ'בורית (bulk) — בחירת מספר נמענים ושליחה מרוכזת. אבל עכשיו יש גם גישה מהירה מכל טבלה.

### קבצים

| פעולה | קובץ |
|-------|------|
| חדש | `src/components/WhatsAppSendDialog.tsx` — דיאלוג שליחה יחיד |
| עריכה | `src/components/ExpandableCustomerRow.tsx` — החלפת wa.me בדיאלוג |
| עריכה | `src/components/CustomerMobileTable.tsx` — אותו שינוי במובייל |
| עריכה | `src/components/scout/ScoutedPropertiesTable.tsx` — הוספת כפתור שליחה |

