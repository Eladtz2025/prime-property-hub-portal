-- Reset יפו neighborhoods that are FALSE POSITIVES (second pass - more aggressive)
-- Only keep יפו for addresses that contain actual Jaffa area indicators
UPDATE scouted_properties
SET neighborhood = NULL
WHERE is_active = true
  AND neighborhood = 'יפו'
  AND (
    -- Address doesn't contain explicit Jaffa indicators
    (address IS NULL OR (
      address NOT LIKE '%עג''מי%' 
      AND address NOT LIKE '%עג מי%'
      AND address NOT LIKE '%יפו ד%'
      AND address NOT LIKE '%יפו ג%'
      AND address NOT LIKE '%יפו ב%'
      AND address NOT LIKE '%יפו א%'
      AND address NOT LIKE '%גבעת התמרים%'
      AND address NOT LIKE '%יפו העתיקה%'
    ))
  );