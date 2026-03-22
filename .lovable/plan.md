

## הוספת צ'קבוקסים + שליחת WhatsApp גורפת בדף הנכסים

### מה ישתנה

**קובץ: `src/pages/Properties.tsx`**

1. **State חדש**: `selectedIds` (Set) + `bulkDialogOpen` (boolean)
2. **טבלת Desktop**: הוספת עמודת צ'קבוקס ראשונה עם "בחר הכל" בכותרת + צ'קבוקס בכל שורה
3. **מובייל**: הוספת צ'קבוקס בכל `MobilePropertyCard` (עוטפים אותו ב-div עם checkbox)
4. **Bulk Bar**: הוספת `WhatsAppBulkBar` + `WhatsAppBulkSendDialog` — הנמענים נבנים מהנכסים שנבחרו (ownerName + ownerPhone)
5. **Import**: הוספת `Checkbox`, `WhatsAppBulkBar`, `WhatsAppBulkSendDialog`

### לוגיקת נמענים
נכסים שנבחרו → מיפוי ל-recipients עם `id`, `name` (ownerName), `phone` (ownerPhone). סינון נכסים בלי טלפון.

### קבצים
| פעולה | קובץ |
|-------|------|
| עריכה | `src/pages/Properties.tsx` — צ'קבוקסים + bulk bar + dialog |

