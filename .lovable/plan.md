

# תיקון False Positives בזיהוי כפילויות

## הבעיה

הלוגיקה הנוכחית ב-`detect_duplicates_batch` מתייחסת ל-`floor IS NULL` כ"מתאים לכל קומה". זה גורם לשרשרת שגויה: דירה ללא קומה מתאימה לדירה בקומה 5, שמצטרפת לאותה קבוצה עם דירה בקומה 4, ובסוף כל הדירות בבניין נמצאות באותה קבוצה למרות שהן שונות לחלוטין.

דוגמה: "לב תל אביב" — 5 דירות עם מחירים בין 11.9M ל-18.5M, שטחים בין 163 ל-232 מ"ר, קומות שונות — כולן בקבוצה אחת.

## הפתרון

### 1. החמרת תנאי הקומה ב-SQL (Migration)

שינוי הלוגיקה מ:
```text
v_prop.floor IS NULL OR sp.floor IS NULL OR sp.floor = v_prop.floor
```
ל:
```text
sp.floor = v_prop.floor  (חובה התאמה מדויקת, NULL לא מתאים)
```

בנוסף, החמרת תנאי המחיר — אם שני הנכסים בקבוצה עם מחירים שונים ביותר מ-30%, הם לא כפילויות:
```text
AND (sp.price IS NULL OR v_prop_price IS NULL 
     OR ABS(sp.price - v_prop_price)::FLOAT / GREATEST(sp.price, v_prop_price) <= 0.30)
```

### 2. איפוס קבוצות שגויות ו-dedup_checked_at

ניקוי כל ה-duplicate_group_id הקיימים ואיפוס dedup_checked_at כדי שכל הנכסים ייבדקו מחדש עם הלוגיקה המתוקנת.

### 3. עדכון `find_property_duplicate` בהתאם

אותו שינוי גם בפונקציית החיפוש הבודדת (שמופעלת בזמן קליטת נכס חדש).

## סדר ביצוע

1. Migration עם הפונקציות המתוקנות + איפוס נתונים
2. הרצה מחדש של סריקת כפילויות מהדשבורד

## פרטים טכניים

Migration SQL:
```sql
-- 1. Update detect_duplicates_batch: require exact floor match + price tolerance
CREATE OR REPLACE FUNCTION public.detect_duplicates_batch(batch_size integer DEFAULT 500)
RETURNS TABLE(...) -- same signature
-- Changes:
--   Remove: v_prop.floor IS NULL OR sp.floor IS NULL OR
--   Add: sp.floor = v_prop.floor (exact match required)
--   Add: price tolerance <= 30%

-- 2. Update find_property_duplicate similarly
CREATE OR REPLACE FUNCTION public.find_property_duplicate(...)
-- Same floor + price changes

-- 3. Reset all duplicate data for re-scan
UPDATE scouted_properties SET 
  duplicate_group_id = NULL, 
  is_primary_listing = true, 
  duplicate_detected_at = NULL, 
  dedup_checked_at = NULL 
WHERE duplicate_group_id IS NOT NULL OR dedup_checked_at IS NOT NULL;
```

