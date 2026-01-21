
-- Update properties with neighborhoods from street_neighborhoods table
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
  AND sp.is_active = true
  AND EXISTS (
    SELECT 1 FROM street_neighborhoods sn 
    WHERE sn.city = 'תל אביב יפו' 
      AND sn.neighborhood IS NOT NULL
      AND sp.address ILIKE sn.street_name || '%'
  );

-- Add known neighborhood mappings to streets
UPDATE street_neighborhoods
SET neighborhood = CASE street_name
  -- צפון ישן
  WHEN 'ארלוזורוב' THEN 'צפון_ישן'
  WHEN 'נורדאו' THEN 'צפון_ישן'
  WHEN 'בן גוריון' THEN 'צפון_ישן'
  WHEN 'דוד המלך' THEN 'צפון_ישן'
  WHEN 'פנקס' THEN 'צפון_ישן'
  -- צפון חדש
  WHEN 'לואי מרשל' THEN 'צפון_חדש'
  WHEN 'יהודה המכבי' THEN 'צפון_חדש'
  WHEN 'וייצמן' THEN 'צפון_חדש'
  WHEN 'קפלן' THEN 'צפון_חדש'
  -- מרכז העיר
  WHEN 'דיזנגוף' THEN 'מרכז_העיר'
  WHEN 'בן יהודה' THEN 'מרכז_העיר'
  WHEN 'אלנבי' THEN 'מרכז_העיר'
  WHEN 'הירקון' THEN 'מרכז_העיר'
  WHEN 'פרישמן' THEN 'מרכז_העיר'
  WHEN 'גורדון' THEN 'מרכז_העיר'
  WHEN 'בוגרשוב' THEN 'מרכז_העיר'
  -- רוטשילד
  WHEN 'רוטשילד' THEN 'רוטשילד'
  WHEN 'מונטיפיורי' THEN 'רוטשילד'
  WHEN 'נחמני' THEN 'רוטשילד'
  -- פלורנטין
  WHEN 'פלורנטין' THEN 'פלורנטין'
  WHEN 'שלוש' THEN 'פלורנטין'
  WHEN 'ויטל' THEN 'פלורנטין'
  -- נווה צדק
  WHEN 'שבזי' THEN 'נווה_צדק'
  WHEN 'אהד העם' THEN 'נווה_צדק'
  WHEN 'יחיאלי' THEN 'נווה_צדק'
  WHEN 'פינס' THEN 'נווה_צדק'
  -- רמת אביב
  WHEN 'איינשטיין' THEN 'רמת_אביב'
  WHEN 'חיים לבנון' THEN 'רמת_אביב'
  WHEN 'קלמן מגן' THEN 'רמת_אביב'
  -- יפו
  WHEN 'יפת' THEN 'יפו'
  WHEN 'ירקון' THEN 'יפו'
  -- בבלי
  WHEN 'שאול המלך' THEN 'בבלי'
  -- צהלה
  WHEN 'גרונר' THEN 'צהלה'
  WHEN 'רזיאל' THEN 'צהלה'
  -- כיכר המדינה
  WHEN 'יהודה הלוי' THEN 'כיכר_המדינה'
  WHEN 'מאפו' THEN 'מרכז_העיר'
  WHEN 'אבן גבירול' THEN 'מרכז_העיר'
  WHEN 'קינג ג׳ורג׳' THEN 'מרכז_העיר'
  WHEN 'שינקין' THEN 'מרכז_העיר'
  WHEN 'לילינבלום' THEN 'רוטשילד'
  WHEN 'הרצל' THEN 'מרכז_העיר'
  WHEN 'ביאליק' THEN 'מרכז_העיר'
  ELSE neighborhood
END
WHERE city = 'תל אביב יפו'
  AND neighborhood IS NULL;
