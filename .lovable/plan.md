

## שינויים בעמוד הווטסאפ

### 1. הסרת כותרת "שיווק" מ-`MarketingHub.tsx`
כבר בוצע בעבר — אוודא שזה אכן מוסר.

### 2. תיקון "בעלי נכסים" — `WhatsAppCompose.tsx`
**הבעיה**: השאילתה שולפת מ-`property_owners` → `profiles`, שזה טבלת המשתמשים/סוכנים במערכת — לא בעלי הנכסים האמיתיים.

**הפתרון**: לשלוף ישירות מטבלת `properties` שיש בה `owner_name` ו-`owner_phone`:
```sql
SELECT id, address, city, owner_name, owner_phone
FROM properties
WHERE owner_phone IS NOT NULL AND owner_phone != ''
```
עמודות: צ'קבוקס | שם בעלים | טלפון | כתובת | עיר

### 3. עמודות חדשות ללקוחות (leads)
במקום סטטוס/עדיפות/ערים/תקציב, להציג:
- **שם** (כבר קיים)
- **טלפון** (כבר קיים)
- **סוג עסקה** (`property_type` — קנייה/שכירות)
- **חדרים** (`rooms_min`-`rooms_max`)
- **תקציב** (`budget_max`)

שליפה מעודכנת: `id, name, phone, property_type, rooms_min, rooms_max, budget_max`

### קבצים
- **עריכה**: `src/components/WhatsAppCompose.tsx` בלבד

