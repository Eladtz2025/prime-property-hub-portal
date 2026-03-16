
-- Fill missing neighborhoods from Madlan comma-part addresses
-- Maps known sub-neighborhood names to our normalized neighborhood values

UPDATE scouted_properties sp
SET neighborhood = CASE 
  WHEN trim(split_part(sp.address, ',', 2)) IN ('כפר שלם', 'התקווה', 'שכונת התקווה', 'שפירא', 'נווה שאנן', 'נוה שאנן', 'נחלת יצחק', 'שיכון עממי ג''', 'תוכנית ל') THEN 'דרום_תל_אביב'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('יד אליהו') THEN 'יד_אליהו'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('נוה אביבים', 'נווה אביבים') THEN 'נווה_אביבים'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('נווה עופר', 'נוה עופר', 'תל כביר', 'יפו ד', 'מרכז יפו', 'צפון יפו', 'יפו העתיקה', 'שוק הפשפשים וצפון יפו', 'נוה גולן', 'נגה') THEN 'יפו'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('נוה שרת', 'נווה שרת', 'עזרא ונחמיה', 'עזרא והארגזים') THEN 'נווה_שרת'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('נוה חן', 'נווה חן') THEN 'צפון_ישן'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('כוכב הצפון', 'רמות צהלה', 'צהלון ושיכוני חסכון', 'גני צהלה') THEN 'צהלה'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('אזורי חן', 'גימל החדשה') THEN 'אזורי_חן'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('תל ברוך צפון', 'תל ברוך דרום', 'תל ברוך') THEN 'תל_ברוך'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('שרונה', 'גני שרונה', 'קרית הממשלה', 'מונטיפיורי') THEN 'רוטשילד'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('מע"ר צפוני', 'לב העיר', 'לבנה וידידיה') THEN 'מרכז_העיר'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('פארק צמרת', 'צמרות', 'שדה דב אשכול', 'שדה דב') THEN 'נמל_תל_אביב'
  WHEN trim(split_part(sp.address, ',', 2)) IN ('המשתלה') THEN 'הדר_יוסף'
  ELSE NULL
END
WHERE sp.is_active = true
  AND (sp.neighborhood IS NULL OR sp.neighborhood = '')
  AND sp.address LIKE '%,%'
  AND trim(split_part(sp.address, ',', 2)) IN (
    'כפר שלם', 'התקווה', 'שכונת התקווה', 'שפירא', 'נווה שאנן', 'נוה שאנן', 'נחלת יצחק',
    'יד אליהו', 'נוה אביבים', 'נווה אביבים', 'נווה עופר', 'נוה עופר', 'תל כביר',
    'נוה שרת', 'נווה שרת', 'עזרא ונחמיה', 'נוה חן', 'נווה חן', 'כוכב הצפון', 'רמות צהלה',
    'צהלון ושיכוני חסכון', 'גני צהלה', 'אזורי חן', 'גימל החדשה', 'תל ברוך צפון',
    'תל ברוך דרום', 'תל ברוך', 'שרונה', 'גני שרונה', 'קרית הממשלה', 'מונטיפיורי',
    'יפו ד', 'מרכז יפו', 'צפון יפו', 'יפו העתיקה', 'שוק הפשפשים וצפון יפו',
    'עזרא והארגזים', 'פארק צמרת', 'צמרות', 'נוה גולן', 'שדה דב אשכול', 'שדה דב',
    'לבנה וידידיה', 'המשתלה', 'נגה', 'שיכון עממי ג''', 'תוכנית ל', 'לב העיר',
    'מע"ר צפוני', 'עג''מי'
  );

-- Also handle עג'מי with different quote style
UPDATE scouted_properties
SET neighborhood = 'יפו'
WHERE is_active = true
  AND (neighborhood IS NULL OR neighborhood = '')
  AND address LIKE '%,%'
  AND trim(split_part(address, ',', 2)) LIKE '%עג%מי%';

-- Handle נופי ים / הגוש הגדול patterns
UPDATE scouted_properties
SET neighborhood = 'רמת_אביב'
WHERE is_active = true
  AND (neighborhood IS NULL OR neighborhood = '')
  AND address LIKE '%,%'
  AND (trim(split_part(address, ',', 2)) LIKE '%נופי ים%' OR trim(split_part(address, ',', 2)) LIKE '%הגוש הגדול%');

-- Now fill from street_neighborhoods table for remaining missing ones
-- Use the neighborhood column (not neighborhood_normalized which is NULL)
-- and map via known patterns
WITH street_matched AS (
  SELECT DISTINCT ON (sp.id)
    sp.id,
    sn.neighborhood as raw_neighborhood
  FROM scouted_properties sp
  JOIN street_neighborhoods sn 
    ON lower(trim(regexp_replace(
        regexp_replace(split_part(sp.address, ',', 1), '^\d+\s*', '', 'g'),
        '\s*\d+.*$', '', 'g'
    ))) = lower(trim(sn.street_name))
  WHERE sp.is_active = true
    AND (sp.neighborhood IS NULL OR sp.neighborhood = '')
    AND sp.address IS NOT NULL AND sp.address != ''
    AND length(trim(regexp_replace(
        regexp_replace(split_part(sp.address, ',', 1), '^\d+\s*', '', 'g'),
        '\s*\d+.*$', '', 'g'
    ))) >= 2
  ORDER BY sp.id, sn.confidence DESC NULLS LAST
)
UPDATE scouted_properties sp
SET neighborhood = CASE
  WHEN sm.raw_neighborhood ~* 'צפון\s*ישן|הצפון\s*הישן|נוה?\s*חן' THEN 'צפון_ישן'
  WHEN sm.raw_neighborhood ~* 'צפון\s*חדש|הצפון\s*החדש' THEN 'צפון_חדש'
  WHEN sm.raw_neighborhood ~* 'לב\s*(?:ה)?עיר|מע"ר|לבנה|מרכז' THEN 'מרכז_העיר'
  WHEN sm.raw_neighborhood ~* 'פלורנטין|נחלת\s*בנימין' THEN 'פלורנטין'
  WHEN sm.raw_neighborhood ~* 'נו?ו?ה?\s*צדק' THEN 'נווה_צדק'
  WHEN sm.raw_neighborhood ~* 'רוטשילד|שרונה|מונטיפיורי|קרית\s*הממשלה' THEN 'רוטשילד'
  WHEN sm.raw_neighborhood ~* 'כרם\s*(?:ה)?תימנים|הירקון' THEN 'כרם_התימנים'
  WHEN sm.raw_neighborhood ~* 'כיכר\s*(?:ה)?מדינה|ככר' THEN 'כיכר_המדינה'
  WHEN sm.raw_neighborhood ~* 'רמת\s*אביב|הגוש\s*הגדול|נופי\s*ים' THEN 'רמת_אביב'
  WHEN sm.raw_neighborhood ~* 'יפו|עג.מי|שוק\s*הפשפשים|נו?ו?ה?\s*עופר|נו?ו?ה?\s*גולן|נגה' THEN 'יפו'
  WHEN sm.raw_neighborhood ~* 'צהלה|כוכב\s*הצפון|צהלון' THEN 'צהלה'
  WHEN sm.raw_neighborhood ~* 'בבלי|הבשן' THEN 'בבלי'
  WHEN sm.raw_neighborhood ~* 'נמל|יורדי\s*הסירה|שדה\s*דב|צמרת|התערוכה' THEN 'נמל_תל_אביב'
  WHEN sm.raw_neighborhood ~* 'תל\s*ברוך' THEN 'תל_ברוך'
  WHEN sm.raw_neighborhood ~* 'שפירא|התקו|כפר\s*שלם|יד\s*אליהו|שיכון\s*עממי' THEN 'דרום_תל_אביב'
  WHEN sm.raw_neighborhood ~* 'אזורי\s*חן|גימל' THEN 'אזורי_חן'
  WHEN sm.raw_neighborhood ~* 'נו?ו?ה?\s*אביבים' THEN 'נווה_אביבים'
  WHEN sm.raw_neighborhood ~* 'הדר\s*יוסף|המשתלה' THEN 'הדר_יוסף'
  WHEN sm.raw_neighborhood ~* 'נו?ו?ה?\s*שרת|עזרא' THEN 'נווה_שרת'
  WHEN sm.raw_neighborhood ~* 'נחלת\s*יצחק' THEN 'נחלת_יצחק'
  WHEN sm.raw_neighborhood ~* 'תל\s*חיים|תכנית\s*ל|למד' THEN 'דרום_תל_אביב'
  ELSE NULL
END
FROM street_matched sm
WHERE sp.id = sm.id
  AND CASE
    WHEN sm.raw_neighborhood ~* 'צפון|חדש|ישן|לב|מע"ר|פלורנטין|נחלת\s*בנימין|צדק|רוטשילד|שרונה|מונטיפיורי|כרם|תימנים|הירקון|כיכר|ככר|רמת\s*אביב|הגוש|נופי|יפו|עג.מי|שוק|צהלה|כוכב|בבלי|הבשן|נמל|יורדי|שדה\s*דב|צמרת|תל\s*ברוך|שפירא|התקו|כפר\s*שלם|יד\s*אליהו|שיכון|אזורי\s*חן|גימל|אביבים|הדר\s*יוסף|המשתלה|שרת|עזרא|נחלת\s*יצחק|תל\s*חיים|תכנית|למד|נוה?\s*חן|נוה?\s*עופר|נוה?\s*גולן|נגה|התערוכה|לבנה|מרכז' THEN true
    ELSE false
  END;
