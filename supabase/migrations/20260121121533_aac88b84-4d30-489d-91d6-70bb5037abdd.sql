
-- Step 1: Insert missing streets (using WHERE NOT EXISTS to avoid duplicates)
INSERT INTO street_neighborhoods (city, street_name, neighborhood, source)
SELECT city, street_name, neighborhood, source FROM (VALUES 
  ('תל אביב יפו', 'אנגל', 'רמת_אביב', 'manual'),
  ('תל אביב יפו', 'הבימה', 'מרכז_העיר', 'manual'),
  ('תל אביב יפו', 'עזה', 'מרכז_העיר', 'manual'),
  ('תל אביב יפו', 'מאנה', 'מרכז_העיר', 'manual'),
  ('תל אביב יפו', 'הרב הרצוג', 'בבלי', 'manual'),
  ('תל אביב יפו', 'יצחק בשביס זינגר', 'רמת_אביב', 'manual'),
  ('תל אביב יפו', 'אדוארד ברנשטיין', 'צפון_חדש', 'manual'),
  ('תל אביב יפו', 'בית יוסף', 'יפו', 'manual'),
  ('תל אביב יפו', 'בר אלי', 'פלורנטין', 'manual'),
  ('תל אביב יפו', 'דב ממזריץ׳', 'צפון_ישן', 'manual'),
  ('תל אביב יפו', 'הארון אלרשיד', 'יפו', 'manual'),
  ('תל אביב יפו', 'הקליר', 'רמת_אביב', 'manual'),
  ('תל אביב יפו', 'יוחנן הגדי', 'יפו', 'manual'),
  ('תל אביב יפו', 'יעקב שבתאי', 'מרכז_העיר', 'manual'),
  ('תל אביב יפו', 'ישראליס', 'מרכז_העיר', 'manual'),
  ('תל אביב יפו', 'לויד ג׳ורג׳', 'מרכז_העיר', 'manual'),
  ('תל אביב יפו', 'מישאל מזרחי', 'יפו', 'manual'),
  ('תל אביב יפו', 'עברי', 'צפון_ישן', 'manual'),
  ('תל אביב יפו', 'שמעון הצדיק', 'יפו', 'manual'),
  ('תל אביב יפו', 'טשרניחובסקי', 'מרכז_העיר', 'manual'),
  ('תל אביב יפו', 'רש״י', 'צפון_ישן', 'manual'),
  ('תל אביב יפו', 'ברודצקי', 'רמת_אביב', 'manual'),
  ('תל אביב יפו', 'נחלת בנימין', 'מרכז_העיר', 'manual'),
  ('תל אביב יפו', 'הכרמל', 'כרם_התימנים', 'manual'),
  ('תל אביב יפו', 'יהודית', 'יפו', 'manual')
) AS v(city, street_name, neighborhood, source)
WHERE NOT EXISTS (
  SELECT 1 FROM street_neighborhoods sn 
  WHERE sn.city = v.city AND sn.street_name = v.street_name
);

-- Step 2: Map remaining streets without neighborhoods
UPDATE street_neighborhoods
SET neighborhood = CASE 
  WHEN street_name ILIKE '%אנגל%' THEN 'רמת_אביב'
  WHEN street_name ILIKE '%ברודצקי%' THEN 'רמת_אביב'
  WHEN street_name ILIKE '%איינשטיין%' THEN 'רמת_אביב'
  WHEN street_name ILIKE '%חיים לבנון%' THEN 'רמת_אביב'
  WHEN street_name ILIKE '%קלמן מגן%' THEN 'רמת_אביב'
  WHEN street_name ILIKE '%הקליר%' THEN 'רמת_אביב'
  WHEN street_name ILIKE '%בשביס זינגר%' THEN 'רמת_אביב'
  WHEN street_name ILIKE '%מודעי%' THEN 'רמת_אביב'
  WHEN street_name ILIKE '%ארלוזורוב%' THEN 'צפון_ישן'
  WHEN street_name ILIKE '%נורדאו%' THEN 'צפון_ישן'
  WHEN street_name ILIKE '%בן גוריון%' THEN 'צפון_ישן'
  WHEN street_name ILIKE '%דוד המלך%' THEN 'צפון_ישן'
  WHEN street_name ILIKE '%פנקס%' THEN 'צפון_ישן'
  WHEN street_name ILIKE '%ז׳בוטינסקי%' THEN 'צפון_ישן'
  WHEN street_name ILIKE '%ירמיהו%' THEN 'צפון_ישן'
  WHEN street_name ILIKE '%עברי%' THEN 'צפון_ישן'
  WHEN street_name ILIKE '%לואי מרשל%' THEN 'צפון_חדש'
  WHEN street_name ILIKE '%יהודה המכבי%' THEN 'צפון_חדש'
  WHEN street_name ILIKE '%וייצמן%' THEN 'צפון_חדש'
  WHEN street_name ILIKE '%קפלן%' THEN 'צפון_חדש'
  WHEN street_name ILIKE '%דה האז%' THEN 'צפון_חדש'
  WHEN street_name ILIKE '%ברנשטיין כהן%' THEN 'צפון_חדש'
  WHEN street_name ILIKE '%דיזנגוף%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%בן יהודה%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%אלנבי%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%הירקון%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%פרישמן%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%גורדון%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%בוגרשוב%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%הבימה%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%עזה%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%מאנה%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%אבן גבירול%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%קינג ג׳ורג׳%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%שינקין%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%מאפו%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%הרצל%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%ביאליק%' THEN 'מרכז_העיר'
  WHEN street_name ILIKE '%רוטשילד%' THEN 'רוטשילד'
  WHEN street_name ILIKE '%מונטיפיורי%' THEN 'רוטשילד'
  WHEN street_name ILIKE '%נחמני%' THEN 'רוטשילד'
  WHEN street_name ILIKE '%לילינבלום%' THEN 'רוטשילד'
  WHEN street_name ILIKE '%פלורנטין%' THEN 'פלורנטין'
  WHEN street_name ILIKE '%שלוש%' THEN 'פלורנטין'
  WHEN street_name ILIKE '%ויטל%' THEN 'פלורנטין'
  WHEN street_name ILIKE '%שבזי%' THEN 'נווה_צדק'
  WHEN street_name ILIKE '%אהד העם%' THEN 'נווה_צדק'
  WHEN street_name ILIKE '%יפת%' THEN 'יפו'
  WHEN street_name ILIKE '%קדם%' THEN 'יפו'
  WHEN street_name ILIKE '%שאול המלך%' THEN 'בבלי'
  WHEN street_name ILIKE '%הרב הרצוג%' THEN 'בבלי'
  WHEN street_name ILIKE '%גרונר%' THEN 'צהלה'
  WHEN street_name ILIKE '%רזיאל%' THEN 'צהלה'
  WHEN street_name ILIKE '%הכרמל%' THEN 'כרם_התימנים'
  WHEN street_name ILIKE '%יהודה הלוי%' THEN 'כיכר_המדינה'
  ELSE neighborhood
END
WHERE city = 'תל אביב יפו' AND neighborhood IS NULL;

-- Step 3: Update properties based on updated street table
UPDATE scouted_properties sp
SET neighborhood = (
  SELECT sn.neighborhood 
  FROM street_neighborhoods sn 
  WHERE sn.city = 'תל אביב יפו' 
    AND sn.neighborhood IS NOT NULL
    AND sp.address ILIKE sn.street_name || '%'
  ORDER BY LENGTH(sn.street_name) DESC
  LIMIT 1
)
WHERE sp.city = 'תל אביב יפו'
  AND sp.neighborhood IS NULL
  AND sp.is_active = true;

-- Step 4: Deactivate properties with invalid addresses
UPDATE scouted_properties
SET is_active = false
WHERE city = 'תל אביב יפו'
  AND is_active = true
  AND (
    address IS NULL 
    OR TRIM(address) = ''
    OR address IN ('דירה', 'מרכולת', 'מרתף/ פרטר', 'בניין מגורים', 'תל אביב יפו', 'Tel Aviv 360', 'דירת גן', 'פנטהאוז', 'קרקע')
    OR LENGTH(TRIM(address)) < 3
  );
