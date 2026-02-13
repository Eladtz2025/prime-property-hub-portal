

# מיזוג קבוצות כפילויות מפוצלות

## המצב

הלוגיקה ב-`detect_duplicates_batch` כבר מתוקנת (exact floor match + 30% price tolerance), אבל נותרו **20+ קבוצות מפוצלות** מהסריקות הישנות. לדוגמה:
- הירקון, קומה 2 -- 4 קבוצות נפרדות (!)
- לב תל אביב, קומה 2 -- 3 קבוצות
- לב תל אביב, קומה 3 -- 3 קבוצות
- פנקס, קומה 9 -- 2 קבוצות

כל קבוצה מציגה "מנצח" משלה, אז רואים שורות כפולות בטבלת הסקאוט.

## הפתרון

Migration אחד שמבצע:

1. **מיזוג קבוצות מפוצלות** -- לכל כתובת+עיר+קומה שנמצאת ביותר מקבוצה אחת, העברת כל הנכסים לקבוצה אחת (`min(duplicate_group_id)`)
2. **ניקוי קבוצות שנותרו עם נכס בודד** -- הרצת `cleanup_orphan_duplicate_groups()`
3. **חישוב מנצחים מחדש** -- הרצת `recompute_duplicate_winners()` כדי שכל קבוצה מאוחדת תבחר מנצח אחד בלבד

## תוצאה צפויה

במקום לראות שורות כפולות בסקאוט (כמו 5 שורות של פנקס 25,000), תראה רק שורה אחת לכל דירה ייחודית.

## פרטים טכניים

קובץ חדש: `supabase/migrations/XXXX_merge_fragmented_groups.sql`

```sql
-- Step 1: Merge fragmented groups (same address+city+floor in multiple groups)
WITH fragmented AS (
  SELECT address, city, floor,
    array_agg(DISTINCT duplicate_group_id) as groups,
    min(duplicate_group_id) as keep_group
  FROM scouted_properties
  WHERE duplicate_group_id IS NOT NULL AND is_active = true
  GROUP BY address, city, floor
  HAVING count(DISTINCT duplicate_group_id) > 1
)
UPDATE scouted_properties sp
SET duplicate_group_id = f.keep_group
FROM fragmented f
WHERE sp.address = f.address AND sp.city = f.city
  AND ((sp.floor IS NULL AND f.floor IS NULL) OR sp.floor = f.floor)
  AND sp.duplicate_group_id = ANY(f.groups)
  AND sp.duplicate_group_id != f.keep_group;

-- Step 2: Cleanup single-property groups
SELECT cleanup_orphan_duplicate_groups();

-- Step 3: Recompute winners for all merged groups
SELECT recompute_duplicate_winners();
```
