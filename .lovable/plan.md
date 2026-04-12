

## תוכנית: עדכון סטטוס 39 נכסים שלא ניתנים להתאמה

### מצב נוכחי
39 נכסים בסטטוס `new` שלא יעברו התאמה לעולם:
- **6** בלי מחיר (price NULL או 0)
- **34** כפילויות לא ראשיות (is_primary_listing = false)
- **1** חופף (גם בלי מחיר וגם לא ראשי)

### תיקון
עדכון סטטוס מ-`new` ל-`checked` עבור שתי הקבוצות — כך הם לא יראו כ"ממתינים להתאמה":

```sql
-- נכסים בלי מחיר
UPDATE scouted_properties 
SET status = 'checked' 
WHERE status = 'new' AND is_active = true AND (price IS NULL OR price = 0);

-- כפילויות לא ראשיות
UPDATE scouted_properties 
SET status = 'checked' 
WHERE status = 'new' AND is_active = true AND is_primary_listing = false;
```

### סיכון: אפסי
- לא משנה מבנה, רק נתונים
- אם יתווסף מחיר או הנכס יהפוך לראשי, ההתאמה הבאה תעדכן את הסטטוס חזרה

