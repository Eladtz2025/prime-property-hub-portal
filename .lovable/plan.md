

## הוספת בחירה מרובה + שליחת WhatsApp גורפת בטבלאות + הסרת טאב ווטסאפ

### הרעיון
הוספת צ'קבוקסים לטבלאות לקוחות, נכסים, ודירות שנמצאו — עם toolbar צף שמופיע כשנבחרו שורות, המאפשר שליחת WhatsApp גורפת עם תבניות. לאחר מכן, הסרת טאב ווטסאפ מ-MarketingHub.

### מה ייבנה

**1. קומפוננטה חדשה: `WhatsAppBulkBar.tsx`**
Toolbar צף (sticky bottom) שמופיע כשיש שורות מסומנות:
- מציג כמה נבחרו ("נבחרו 5 לקוחות")
- כפתור "שלח WhatsApp" → פותח דיאלוג שליחה גורפת
- כפתור "בטל בחירה"

**2. קומפוננטה חדשה: `WhatsAppBulkSendDialog.tsx`**
דיאלוג שליחה גורפת (דומה ל-WhatsAppCompose אבל כ-dialog):
- רשימת הנמענים שנבחרו (שם + טלפון)
- בחירת תבנית (Popover עם עיפרון — אותו מנגנון)
- Textarea לעריכת ההודעה עם placeholders
- כפתור שליחה לכולם (שולח אחד-אחד דרך useWhatsAppSender)
- Progress bar במהלך השליחה

**3. הטמעה בטבלת לקוחות**
- `CustomerTableView.tsx`: הוספת עמודת צ'קבוקס + state של selectedIds + צ'קבוקס "בחר הכל" בכותרת
- `ExpandableCustomerRow.tsx`: הוספת prop `isSelected` + `onToggleSelect` + צ'קבוקס בשורה
- `CustomerMobileTable.tsx`: אותו מנגנון במובייל
- הקומפוננטה העוטפת (דף לקוחות): מוסיפה `WhatsAppBulkBar` מתחת לטבלה

**4. הטמעה בטבלת נכסים ודירות שנמצאו**
- אותו מנגנון צ'קבוקסים + bulk bar בטבלאות הנכסים והדירות

**5. הסרת טאב ווטסאפ מ-MarketingHub**
- הסרת הטאב "ווטסאפ" והקומפוננטה `WhatsAppCompose` מ-MarketingHub
- שלושת הטאבים הופכים לשניים: **פרסום** + **עוד** (או שנשנה את המבנה)

### קבצים

| פעולה | קובץ |
|-------|------|
| חדש | `src/components/WhatsAppBulkBar.tsx` — toolbar צף עם כפתור שליחה |
| חדש | `src/components/WhatsAppBulkSendDialog.tsx` — דיאלוג שליחה גורפת |
| עריכה | `src/components/CustomerTableView.tsx` — הוספת צ'קבוקסים + selectedIds |
| עריכה | `src/components/ExpandableCustomerRow.tsx` — prop isSelected + צ'קבוקס |
| עריכה | `src/components/CustomerMobileTable.tsx` — צ'קבוקסים במובייל |
| עריכה | `src/components/scout/ScoutedPropertiesTable.tsx` — צ'קבוקסים |
| עריכה | דף הלקוחות (parent) — חיבור ה-bulk bar |
| עריכה | `src/pages/MarketingHub.tsx` — הסרת טאב ווטסאפ |

### סדר ביצוע
1. `WhatsAppBulkBar` + `WhatsAppBulkSendDialog` — קומפוננטות חדשות
2. הטמעה בטבלת לקוחות (desktop + mobile)
3. הטמעה בטבלת נכסים ודירות שנמצאו
4. הסרת טאב ווטסאפ מ-MarketingHub

