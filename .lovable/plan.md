

# תיקון כפילויות + ניקוי נכסים לא מתל אביב

## הבעיות שזוהו

| בעיה | כמות | סיבה |
|------|------|------|
| נכסים כפולים לא מקובצים | 100+ קבוצות | `detect_duplicates_batch` לא רץ |
| נכסים מחוץ לתל אביב | 81 | עיר מופיעה בכתובת, לא בשדה city |

## פתרון מלא

### שלב 1: Migration לתיקון מיידי

```sql
-- 1. DEACTIVATE all properties with non-TA cities in address
UPDATE scouted_properties
SET is_active = false
WHERE is_active = true
  AND (
    address ILIKE '%באר יעקב%'
    OR address ILIKE '%ראש העין%'
    OR address ILIKE '%ירושלים%'
    OR address ILIKE '%יבנה%'
    OR address ILIKE '%גני תקווה%'
    OR address ILIKE '%שוהם%'
    OR address ILIKE '%כפר סבא%'
    OR address ILIKE '%קרית אונו%'
    OR address ILIKE '%רמת גן%'
    OR address ILIKE '%גבעתיים%'
    OR address ILIKE '%חולון%'
    OR address ILIKE '%בת ים%'
    OR address ILIKE '%פתח תקווה%'
    OR address ILIKE '%נתניה%'
    OR address ILIKE '%מודיעין%'
    OR address ILIKE '%הרצליה%'
    OR address ILIKE '%רעננה%'
    OR address ILIKE '%הוד השרון%'
    OR address ILIKE '%אשדוד%'
    OR address ILIKE '%ראשון לציון%'
    OR address ILIKE '%נס ציונה%'
    OR address ILIKE '%כפר יונה%'
    OR address ILIKE '%צור יגאל%'
    OR address ILIKE '%אלעד%'
    OR address ILIKE '%בית שמש%'
    OR address ILIKE '%פרדס חנה%'
    OR address ILIKE '%זכרון יעקב%'
    OR address ILIKE '%נהריה%'
    OR address ILIKE '%עפולה%'
    OR address ILIKE '%טבריה%'
    OR address ILIKE '%אילת%'
    OR address ILIKE '%חיפה%'
    OR address ILIKE '%באר שבע%'
  );

-- 2. RUN duplicate detection on ALL eligible properties
DO $$
DECLARE
  batch_result RECORD;
  total_found INTEGER := 0;
  total_groups INTEGER := 0;
  iterations INTEGER := 0;
BEGIN
  LOOP
    SELECT * INTO batch_result 
    FROM detect_duplicates_batch(1000);
    
    total_found := total_found + batch_result.duplicates_found;
    total_groups := total_groups + batch_result.groups_created;
    iterations := iterations + 1;
    
    -- Stop when no more properties to process
    EXIT WHEN batch_result.properties_processed = 0 OR iterations > 20;
  END LOOP;
  
  RAISE NOTICE 'Duplicate detection complete: % duplicates in % groups', 
    total_found, total_groups;
END $$;
```

### שלב 2: שיפור ה-Trigger לבדיקת כתובת

נעדכן את הטריגר `check_tel_aviv_only` לבדוק גם את הכתובת:

```sql
CREATE OR REPLACE FUNCTION check_tel_aviv_only()
RETURNS TRIGGER AS $$
DECLARE
  non_ta_cities TEXT[] := ARRAY[
    'באר יעקב', 'ראש העין', 'ירושלים', 'יבנה', 'גני תקווה', 
    'שוהם', 'כפר סבא', 'קרית אונו', 'רמת גן', 'גבעתיים', 
    'חולון', 'בת ים', 'פתח תקווה', 'נתניה', 'מודיעין', 
    'הרצליה', 'רעננה', 'הוד השרון', 'אשדוד', 'ראשון לציון',
    'נס ציונה', 'כפר יונה', 'צור יגאל', 'אלעד', 'בית שמש',
    'פרדס חנה', 'זכרון יעקב', 'נהריה', 'עפולה', 'טבריה',
    'אילת', 'חיפה', 'באר שבע', 'נתיבות', 'אופקים', 'דימונה',
    'ערד', 'לוד', 'רמלה', 'נתניה'
  ];
  city_name TEXT;
BEGIN
  -- Check 1: city field is not Tel Aviv
  IF NEW.city IS NOT NULL 
     AND NEW.city NOT LIKE '%תל אביב%' 
     AND NEW.city NOT LIKE '%תל-אביב%'
     AND NEW.city NOT LIKE '%Tel Aviv%' THEN
    NEW.is_active := false;
    RETURN NEW;
  END IF;
  
  -- Check 2: address contains a non-Tel Aviv city
  IF NEW.address IS NOT NULL THEN
    FOREACH city_name IN ARRAY non_ta_cities LOOP
      IF NEW.address ILIKE '%' || city_name || '%' THEN
        NEW.is_active := false;
        RETURN NEW;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## תוצאה צפויה

| מדד | לפני | אחרי |
|-----|------|------|
| נכסים לא מתל אביב | 81 | 0 |
| קבוצות כפילויות מזוהות | 0 | ~50-100 |
| נכסים כפולים מקובצים | 0 | ~200+ |

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| Migration חדש | יצירה - ניקוי + זיהוי כפילויות |
| check_tel_aviv_only trigger | עדכון - בדיקת כתובת |

