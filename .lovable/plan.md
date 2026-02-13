

# תיקון הצגת כפילויות בטבלת הסקאוט

## הבעיה

יש שתי בעיות שגורמות לכך שרואים "כפילויות" בטבלת הסקאוט:

### בעיה 1: קבוצות מפוצלות (17 מקרים)
אותה דירה (אותה כתובת + קומה + מחיר) נמצאת בשתי קבוצות כפילויות נפרדות. לדוגמה: "פנקס, קומה 9, 25,000 ש"ח" — קבוצה אחת עם 7 נכסים וקבוצה שנייה עם נכס בודד. כל קבוצה מציגה "מנצח" משלה, אז רואים שתי שורות שנראות זהות.

### בעיה 2: הלוגיקה ב-SQL לא תוקנה באמת
ה-Migration האחרון היה אמור לדרוש התאמה מדויקת בקומה, אבל הקוד עדיין מאפשר ל-NULL להתאים לכל קומה:
```text
v_prop.floor IS NULL OR sp.floor IS NULL OR sp.floor = v_prop.floor
```
זה עדיין הלוגיקה הישנה שגורמת ל-false positives.

## הפתרון

### 1. מיזוג קבוצות מפוצלות (Migration)
סקריפט SQL שמאחד קבוצות כפילויות שהתפצלו — מאחד את כל הנכסים עם אותה כתובת/עיר/קומה/סוג נכס לקבוצה אחת.

### 2. תיקון אמיתי של לוגיקת הקומה
שינוי התנאי כך ששני הנכסים חייבים שדה קומה תקין (לא NULL) והם חייבים להיות זהים:
```text
sp.floor = v_prop.floor  (בלי ה-NULL wildcards)
```
נכסים ללא קומה יסומנו כ-skipped ולא ישויכו לקבוצות.

### 3. הרצת recompute_duplicate_winners
לאחר המיזוג, חישוב מחדש של המנצחים בכל הקבוצות המאוחדות.

## סדר ביצוע

1. Migration חדש עם:
   - תיקון `detect_duplicates_batch` — הסרת NULL wildcards מתנאי הקומה
   - תיקון `find_property_duplicate` — אותו שינוי
   - מיזוג 17 הקבוצות המפוצלות (כל הנכסים עם אותה כתובת/עיר/קומה שנמצאים בקבוצות שונות יאוחדו)
   - הרצת `recompute_duplicate_winners()` מחדש
   - איפוס `dedup_checked_at` לנכסים שהושפעו

## תוצאה צפויה

במקום לראות 5 שורות של "פנקס 25,000" בסקאוט — תראה 3 שורות בלבד (קומה 7, קומה 8, קומה 9+28 — כי קומה 9 תאוחד לקבוצה אחת עם מנצח אחד, וקומה 28 היא דירת 2 חדרים שונה לגמרי).

## פרטים טכניים

קובץ חדש: `supabase/migrations/XXXX_merge_fragmented_groups.sql`

```sql
-- 1. Fix detect_duplicates_batch: truly require exact floor match
CREATE OR REPLACE FUNCTION detect_duplicates_batch(...)
-- Change: Remove "v_prop.floor IS NULL OR sp.floor IS NULL OR"
-- Add floor IS NOT NULL to skip filter

-- 2. Fix find_property_duplicate similarly

-- 3. Merge fragmented groups
WITH fragmented AS (
  SELECT address, city, floor, property_type,
    array_agg(DISTINCT duplicate_group_id) as groups,
    min(duplicate_group_id) as keep_group
  FROM scouted_properties
  WHERE duplicate_group_id IS NOT NULL AND is_active = true
  GROUP BY address, city, floor, property_type
  HAVING count(DISTINCT duplicate_group_id) > 1
)
UPDATE scouted_properties sp
SET duplicate_group_id = f.keep_group
FROM fragmented f
WHERE sp.address = f.address AND sp.city = f.city
  AND sp.floor = f.floor AND sp.property_type = f.property_type
  AND sp.duplicate_group_id != f.keep_group;

-- 4. Recompute winners
SELECT recompute_duplicate_winners();
```

