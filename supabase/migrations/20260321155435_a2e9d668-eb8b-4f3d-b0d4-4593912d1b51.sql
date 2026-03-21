
-- Step 1: Normalize scraper neighborhood aliases to canonical labels

-- צפון ישן
UPDATE scouted_properties SET neighborhood = 'צפון ישן' WHERE is_active = true AND neighborhood IN (
  'הצפון הישן', 'הצפון הישן - צפון', 'הצפון הישן - דרום',
  'הצפון הישן החלק הצפוני', 'הצפון הישן החלק המרכזי',
  'הצפון הישן החלק הדרום מזרחי', 'הצפון הישן החלק הדרום מערבי',
  'צפון הישן', 'הצפון הישן צפון', 'הצפון הישן דרום'
);

-- צפון חדש
UPDATE scouted_properties SET neighborhood = 'צפון חדש' WHERE is_active = true AND neighborhood IN (
  'הצפון החדש', 'הצפון החדש - צפון', 'הצפון החדש - דרום',
  'הצפון החדש החלק הצפוני', 'הצפון החדש החלק הדרומי',
  'צפון החדש', 'הצפון החדש צפון', 'הצפון החדש דרום'
);

-- כיכר המדינה
UPDATE scouted_properties SET neighborhood = 'כיכר המדינה' WHERE is_active = true AND neighborhood IN (
  'הצפון החדש סביבת כיכר המדינה', 'הצפון החדש - כיכר המדינה',
  'סביבת כיכר המדינה', 'אזור ככר המדינה', 'ככר המדינה'
);

-- מרכז העיר
UPDATE scouted_properties SET neighborhood = 'מרכז העיר' WHERE is_active = true AND neighborhood IN (
  'לב העיר', 'לב תל אביב', 'לב העיר צפון', 'לב העיר דרום',
  'לב תל אביב, לב העיר צפון', 'לב תל אביב, לב העיר דרום',
  'לב תל אביב החלק המערבי', 'לבהעיר', 'מונטיפיורי, הרכבת', 'הרכבת'
);

-- רוטשילד
UPDATE scouted_properties SET neighborhood = 'רוטשילד' WHERE is_active = true AND neighborhood IN (
  'דרום רוטשילד', 'שרונה', 'גני שרונה', 'גני שרונה, קרית הממשלה', 'קרית הממשלה'
);

-- רמת אביב
UPDATE scouted_properties SET neighborhood = 'רמת אביב' WHERE is_active = true AND neighborhood IN (
  'רמת אביב החדשה', 'רמת אביב ג',
  'נופי ים', 'הגוש הגדול', 'הגוש הגדול, רמת אביב החדשה, נופי ים'
);

-- צהלה
UPDATE scouted_properties SET neighborhood = 'צהלה' WHERE is_active = true AND neighborhood IN (
  'גני צהלה', 'צהלון', 'רמות צהלה', 'גני צהלה, רמות צהלה',
  'כוכב הצפון', 'צהלון, שיכוני חסכון'
);

-- תל ברוך
UPDATE scouted_properties SET neighborhood = 'תל ברוך' WHERE is_active = true AND neighborhood IN (
  'תל ברוך צפון', 'תל ברוך דרום'
);

-- דרום תל אביב
UPDATE scouted_properties SET neighborhood = 'דרום תל אביב' WHERE is_active = true AND neighborhood IN (
  'שפירא', 'נווה שאנן', 'נוה שאנן', 'התקווה', 'שכונת התקווה',
  'כפר שלם', 'התקוה, בית יעקב, נווה צה"ל'
);

-- אזורי חן
UPDATE scouted_properties SET neighborhood = 'אזורי חן' WHERE is_active = true AND neighborhood IN (
  'אזורי חן, גימל החדשה', 'גימל החדשה'
);

-- בבלי
UPDATE scouted_properties SET neighborhood = 'בבלי' WHERE is_active = true AND neighborhood IN (
  'שיכון בבלי', 'הבשן', 'בבלי, הבשן'
);

-- נווה אביבים
UPDATE scouted_properties SET neighborhood = 'נווה אביבים' WHERE is_active = true AND neighborhood IN ('נוה אביבים');

-- נווה צדק
UPDATE scouted_properties SET neighborhood = 'נווה צדק' WHERE is_active = true AND neighborhood IN ('נוה צדק', 'נוה צדק, מונטיפיורי');

-- יפו
UPDATE scouted_properties SET neighborhood = 'יפו' WHERE is_active = true AND neighborhood IN (
  'יפו ג', 'יפו ד', 'יפו העתיקה', 'מרכז יפו', 'צפון יפו',
  'צפון יפו, המושבה האמריקאית-גרמנית'
);

-- פלורנטין
UPDATE scouted_properties SET neighborhood = 'פלורנטין' WHERE is_active = true AND neighborhood IN (
  'דרום פלורנטין', 'נחלת בנימין, פלורנטין', 'נחלת בנימין'
);

-- נווה שרת
UPDATE scouted_properties SET neighborhood = 'נווה שרת' WHERE is_active = true AND neighborhood IN (
  'נוה שרת', 'נווה שרת, עזרא ונחמיה', 'נוה שרת, עזרא ונחמיה'
);

-- אפקה (new canonical)
UPDATE scouted_properties SET neighborhood = 'אפקה' WHERE is_active = true AND neighborhood LIKE '%נאות אפקה%';

-- תכנית ל (new canonical)
UPDATE scouted_properties SET neighborhood = 'תכנית ל׳' WHERE is_active = true AND neighborhood LIKE '%תכנית ל%';

-- נווה עופר
UPDATE scouted_properties SET neighborhood = 'נווה עופר' WHERE is_active = true AND neighborhood IN ('נוה עופר');

-- City-as-neighborhood to NULL
UPDATE scouted_properties SET neighborhood = NULL WHERE is_active = true AND neighborhood IN (
  'תל אביב יפו', 'תל אביב', 'תל-אביב'
);

-- Step 2: Fill NULL neighborhoods from street_neighborhoods table
UPDATE scouted_properties sp
SET neighborhood = sn.neighborhood
FROM street_neighborhoods sn
WHERE sp.is_active = true
  AND sp.neighborhood IS NULL
  AND sp.city = sn.city
  AND sp.address IS NOT NULL
  AND trim(regexp_replace(sp.address, '[0-9].*$', '')) = sn.street_name;

-- Step 3: Normalize street_neighborhoods table itself
UPDATE street_neighborhoods SET neighborhood = 'צפון ישן' WHERE neighborhood IN ('הצפון הישן', 'הצפון הישן - צפון', 'הצפון הישן - דרום', 'הצפון הישן החלק הצפוני', 'הצפון הישן החלק המרכזי', 'הצפון הישן החלק הדרום מזרחי', 'הצפון הישן החלק הדרום מערבי');
UPDATE street_neighborhoods SET neighborhood = 'צפון חדש' WHERE neighborhood IN ('הצפון החדש', 'הצפון החדש - צפון', 'הצפון החדש - דרום', 'הצפון החדש החלק הצפוני', 'הצפון החדש החלק הדרומי');
UPDATE street_neighborhoods SET neighborhood = 'כיכר המדינה' WHERE neighborhood IN ('הצפון החדש סביבת כיכר המדינה', 'הצפון החדש - כיכר המדינה', 'סביבת כיכר המדינה');
UPDATE street_neighborhoods SET neighborhood = 'מרכז העיר' WHERE neighborhood IN ('לב העיר', 'לב תל אביב', 'לב העיר צפון', 'לב העיר דרום', 'לב תל אביב, לב העיר צפון', 'לב תל אביב, לב העיר דרום');
UPDATE street_neighborhoods SET neighborhood = 'רוטשילד' WHERE neighborhood IN ('דרום רוטשילד', 'שרונה', 'גני שרונה', 'גני שרונה, קרית הממשלה', 'קרית הממשלה');
UPDATE street_neighborhoods SET neighborhood = 'רמת אביב' WHERE neighborhood IN ('רמת אביב החדשה', 'רמת אביב ג', 'נופי ים', 'הגוש הגדול', 'הגוש הגדול, רמת אביב החדשה, נופי ים');
UPDATE street_neighborhoods SET neighborhood = 'צהלה' WHERE neighborhood IN ('גני צהלה', 'צהלון', 'רמות צהלה', 'גני צהלה, רמות צהלה', 'כוכב הצפון');
UPDATE street_neighborhoods SET neighborhood = 'תל ברוך' WHERE neighborhood IN ('תל ברוך צפון', 'תל ברוך דרום');
UPDATE street_neighborhoods SET neighborhood = 'דרום תל אביב' WHERE neighborhood IN ('שפירא', 'נווה שאנן', 'נוה שאנן', 'התקווה', 'שכונת התקווה', 'כפר שלם');
UPDATE street_neighborhoods SET neighborhood = 'אזורי חן' WHERE neighborhood IN ('אזורי חן, גימל החדשה', 'גימל החדשה');
UPDATE street_neighborhoods SET neighborhood = 'בבלי' WHERE neighborhood IN ('שיכון בבלי', 'הבשן');
UPDATE street_neighborhoods SET neighborhood = 'נווה אביבים' WHERE neighborhood IN ('נוה אביבים');
UPDATE street_neighborhoods SET neighborhood = 'נווה צדק' WHERE neighborhood IN ('נוה צדק');
UPDATE street_neighborhoods SET neighborhood = 'יפו' WHERE neighborhood IN ('יפו ג', 'יפו ד', 'יפו העתיקה', 'מרכז יפו', 'צפון יפו');
UPDATE street_neighborhoods SET neighborhood = 'פלורנטין' WHERE neighborhood IN ('דרום פלורנטין', 'נחלת בנימין, פלורנטין', 'נחלת בנימין');
UPDATE street_neighborhoods SET neighborhood = 'נווה שרת' WHERE neighborhood IN ('נוה שרת');
UPDATE street_neighborhoods SET neighborhood = 'אפקה' WHERE neighborhood LIKE '%נאות אפקה%';
UPDATE street_neighborhoods SET neighborhood = 'נווה עופר' WHERE neighborhood IN ('נוה עופר');

-- Remove duplicate rows in street_neighborhoods
DELETE FROM street_neighborhoods a
USING street_neighborhoods b
WHERE a.id > b.id
  AND a.street_name = b.street_name
  AND a.city = b.city
  AND a.neighborhood = b.neighborhood;
