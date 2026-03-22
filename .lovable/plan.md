

## הפרדת תבניות WhatsApp לפי הקשר (לקוחות / נכסים / דירות שנמצאו)

### הרעיון
הטבלה `message_templates` כבר מכילה עמודה `category` שלא בשימוש. נשתמש בה כדי לסנן תבניות לפי ההקשר — כל טבלה רואה ועורכת רק את התבניות שלה.

### ערכי category
- `customers` — תבניות ללקוחות
- `properties` — תבניות לבעלי נכסים
- `scouted` — תבניות לדירות שנמצאו (סקאוט)

### שינויים

**1. `WhatsAppSendDialog.tsx`**
- הוספת prop `templateCategory` (string)
- `loadTemplates()` → סינון לפי `category`: `.eq('category', templateCategory)`
- בעריכת תבנית — שמירת ה-`category` הנכון

**2. `WhatsAppBulkSendDialog.tsx`**
- אותו שינוי: prop `templateCategory` + סינון ב-query

**3. מעבירי ה-props (3 מקומות)**
- `ExpandableCustomerRow.tsx` / `CustomerMobileTable.tsx` → `templateCategory="customers"`
- `Properties.tsx` → `templateCategory="properties"`
- `ScoutedPropertiesTable.tsx` → `templateCategory="scouted"`

**4. `WhatsAppBulkBar.tsx`**
- הוספת prop `templateCategory` שמועבר הלאה ל-`WhatsAppBulkSendDialog`

### קבצים

| פעולה | קובץ |
|-------|------|
| עריכה | `src/components/WhatsAppSendDialog.tsx` — prop + סינון |
| עריכה | `src/components/WhatsAppBulkSendDialog.tsx` — prop + סינון |
| עריכה | `src/components/WhatsAppBulkBar.tsx` — העברת prop |
| עריכה | `src/components/ExpandableCustomerRow.tsx` — `templateCategory="customers"` |
| עריכה | `src/components/CustomerMobileTable.tsx` — `templateCategory="customers"` |
| עריכה | `src/pages/Properties.tsx` — `templateCategory="properties"` |
| עריכה | `src/components/scout/ScoutedPropertiesTable.tsx` — `templateCategory="scouted"` |

### מיגרציה
לא נדרשת — העמודה `category` כבר קיימת. תבניות קיימות עם `category` ריק/אחר יופיעו רק אם נעדכן אותן. תבניות חדשות שנוצרות מכל טבלה יקבלו את ה-category הנכון אוטומטית.

