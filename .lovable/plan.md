## איפוס 583 נכסי Yad2 חשודים להשלמת נתונים

### מה נעשה
איפוס `backfill_status` מ-`completed` ל-`pending` עבור 583 נכסים שעומדים בתנאים:
- `source = 'yad2'`
- `is_active = true`
- `status IN ('checked','matched','new')`
- `backfill_status = 'completed'`
- `features.parking = 'true'` **ללא** `features.parkingSpots` (כלומר Parking הוגדר רק על-ידי ה-fallback regex)

### מה לא נעשה
- **לא** מתקנים את הקוד (parser/sanity check) — בהמשך לבקשתך
- **לא** מוחקים את `features.parking` הקיים — נשאר עד שה-backfill יעבור ויעדכן
- **לא** נוגעים ב-570 נכסים עם `parking=null` (לא ביקשת)
- **לא** נוגעים בשום שדה אחר חוץ מ-`backfill_status`

### ההשפעה
ה-cron הלילי הקיים (00:00-02:30) יזהה את 583 הנכסים כ-`pending` ויריץ עליהם backfill מחדש בלילות הקרובים (~3-4 לילות במקצב הנוכחי).

### SQL שיורץ
```sql
UPDATE scouted_properties
SET backfill_status = 'pending'
WHERE source = 'yad2'
  AND backfill_status = 'completed'
  AND is_active = true
  AND status IN ('checked','matched','new')
  AND (features->>'parking') = 'true'
  AND NOT (features ? 'parkingSpots');
```

לאחר הביצוע אריץ COUNT לאימות ש-583 נכסים אכן עברו ל-pending.
