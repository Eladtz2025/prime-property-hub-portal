-- Step 1: Clear incorrect sizes from homeless properties
-- These sizes were extracted from "מודעות דומות" (related ads) section instead of the actual listing
UPDATE scouted_properties 
SET size = NULL
WHERE source = 'homeless' 
AND size IS NOT NULL;

-- Step 2: Update titles to include street names where available
-- This makes titles more descriptive: "דירה 3 חדרים בארלוזורוב, צפון ישן" instead of "דירה 3 חדרים בצפון ישן"
UPDATE scouted_properties
SET title = CONCAT(
  CASE 
    WHEN title LIKE 'דירת גג%' THEN 'דירת גג'
    WHEN title LIKE 'פנטהאוז%' THEN 'פנטהאוז'
    WHEN title LIKE 'סטודיו%' THEN 'סטודיו'
    WHEN title LIKE 'דופלקס%' THEN 'דופלקס'
    WHEN title LIKE 'מיני פנטהאוז%' THEN 'מיני פנטהאוז'
    WHEN title LIKE 'דירה%' THEN 'דירה'
    ELSE 'דירה'
  END,
  CASE WHEN rooms IS NOT NULL THEN CONCAT(' ', rooms::text, ' חדרים') ELSE '' END,
  ' ב',
  SPLIT_PART(address, ',', 1),
  CASE WHEN neighborhood IS NOT NULL AND neighborhood != '' THEN CONCAT(', ', neighborhood) ELSE '' END
)
WHERE source = 'homeless'
AND address IS NOT NULL
AND address LIKE '%, %'
AND SPLIT_PART(address, ',', 1) != '';