-- ============================================
-- QA FIX: Clean up wrong neighborhoods and addresses
-- ============================================

-- 1. Reset "יפו" neighborhoods that are FALSE POSITIVES
-- Only keep יפו for addresses that are actually IN Jaffa (עג'מי, נוגה, יפו העתיקה, etc.)
UPDATE scouted_properties
SET neighborhood = NULL
WHERE is_active = true
  AND neighborhood = 'יפו'
  AND (
    -- Address doesn't contain Jaffa indicators
    (address NOT LIKE '%יפו%' OR address IS NULL)
    AND (address NOT LIKE '%עג''מי%' OR address IS NULL)
    AND (address NOT LIKE '%נוגה%' OR address IS NULL)
    AND (address NOT LIKE '%פלורה%' OR address IS NULL)
  );

-- 2. Reset addresses that are actually broker names
UPDATE scouted_properties
SET address = NULL
WHERE is_active = true
  AND (
    address LIKE '%Relocation%'
    OR address LIKE '%REAL ESTATE%'
    OR address LIKE '%רימקס%'
    OR address LIKE '%RE/MAX%'
    OR address LIKE '%Properties%'
    OR address LIKE '%Premium%'
    OR address LIKE '%אנגלו סכסון%'
    OR address LIKE '%FRANCHI%'
    OR address LIKE '%HomeMe%'
  );

-- 3. Reset addresses that are just neighborhood names (not real addresses)
UPDATE scouted_properties
SET address = NULL
WHERE is_active = true
  AND address IS NOT NULL
  AND (
    address = 'הצפון החדש - צפון'
    OR address = 'הצפון הישן - צפון'
    OR address = 'צפון'
    OR address = 'מרכז'
    OR address LIKE 'הצפון ה%'
  );

-- 4. Deactivate properties from irrelevant cities (outside Tel Aviv metro)
UPDATE scouted_properties
SET is_active = false
WHERE is_active = true
  AND source = 'homeless'
  AND (
    address LIKE '%קרית ארבע%'
    OR address LIKE '%עתלית%'
    OR address LIKE '%כינרת מושבה%'
    OR address LIKE '%מעלות תרשיחא%'
    OR (city IS NOT NULL AND city NOT IN ('תל אביב יפו', 'רמת גן', 'גבעתיים', 'הרצליה', 'רעננה', 'בני ברק', 'חולון', 'בת ים', 'ראשון לציון'))
  );