

## ניקוי כפילויות קיימות מאותו מקור

### ממצאים
נמצאו **~25 קבוצות כפילויות** מאותו מקור (madlan, yad2, homeless) — כולן עם אותם כתובת+עיר+חדרים+קומה+מחיר+סוג נכס. חלקן עם 3 רשומות, רובן עם 2.

### תוכנית ביצוע

**שלב 1: מיגרציית ניקוי אוטומטית**

במקום לכתוב ידנית כל ID, נריץ SQL שמטפל בכל הקבוצות בבת אחת:

```sql
-- For each group of same-source duplicates (same address/city/rooms/floor/price/source/type),
-- keep the oldest record (first created) and deactivate the rest
WITH duplicates AS (
  SELECT id, 
    ROW_NUMBER() OVER (
      PARTITION BY address, city, rooms, floor, price, source, property_type
      ORDER BY created_at ASC
    ) as rn
  FROM scouted_properties
  WHERE is_active = true
    AND address IS NOT NULL AND rooms IS NOT NULL 
    AND floor IS NOT NULL AND price IS NOT NULL
)
UPDATE scouted_properties
SET is_active = false, 
    status = 'inactive',
    availability_checked_at = now(),
    availability_check_reason = 'merged_same_source_duplicate',
    updated_at = now()
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Clean orphan groups
SELECT cleanup_orphan_duplicate_groups();
```

**שלב 2: אימות**

שאילתת בדיקה שמוודאת שלא נשארו כפילויות.

### קבצים
- מיגרציית SQL בלבד (ניקוי דאטא). אין שינויי קוד — הלוגיקה למניעת כפילויות עתידיות כבר הוטמעה.

### תוצאה
~25 רשומות כפולות יסומנו כלא פעילות. קבוצות כפילויות יתומות ינוקו אוטומטית.

