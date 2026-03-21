
-- Drop unique constraint first
ALTER TABLE street_neighborhoods DROP CONSTRAINT IF EXISTS street_neighborhoods_unique_street_city_neighborhood;

-- =============================================
-- Normalize neighborhood names to canonical values
-- =============================================

UPDATE street_neighborhoods SET neighborhood = 'צפון ישן' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'הצפון הישן - צפון', 'הצפון הישן - דרום', 
  'הצפון הישן החלק הצפוני', 'הצפון הישן החלק המרכזי',
  'הצפון הישן החלק הדרום מזרחי', 'הצפון הישן החלק הדרום מערבי',
  'צפון_ישן', 'צפון ישן'
);

UPDATE street_neighborhoods SET neighborhood = 'צפון חדש' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'הצפון החדש', 'הצפון החדש - צפון', 'הצפון החדש - דרום',
  'הצפון החדש החלק הצפוני', 'הצפון החדש החלק הדרומי',
  'צפון_חדש', 'צפון חדש',
  'שיכון דן', 'שיכון דן, נווה דן', 'רביבים'
);

UPDATE street_neighborhoods SET neighborhood = 'כיכר המדינה' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'הצפון החדש - כיכר המדינה', 'הצפון החדש סביבת כיכר המדינה',
  'הצפון החדש סביבת כיכר', 'כיכר המדינה', 'כיכר_המדינה'
);

UPDATE street_neighborhoods SET neighborhood = 'מרכז העיר' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'לב תל אביב', 'לב תל אביב החלק המערבי', 'לב תל אביב, לב העיר צפון',
  'מרכז העיר', 'מרכז_העיר', 'מרכז', 'שינקין',
  'מונטיפיורי, הרכבת', 'תחנה מרכזית הישנה',
  'תוכנית ל',
  'אורות', 'לבנה', 'לבנה וידידיה', 'ליבנה', 'מנדרין', 'URBANIX', 'WE'
);
UPDATE street_neighborhoods SET neighborhood = 'מרכז העיר' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'תכנית ל%';
UPDATE street_neighborhoods SET neighborhood = 'מרכז העיר' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'ל'' החדשה%';
UPDATE street_neighborhoods SET neighborhood = 'מרכז העיר' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'מע"ר%';

UPDATE street_neighborhoods SET neighborhood = 'רוטשילד' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'דרום רוטשילד', 'רוטשילד', 'מונטיפיורי', 'שרונה',
  'גני שרונה', 'גני שרונה, קרית הממשלה',
  'פארק צמרת', 'צמרות איילון, פארק צמרת'
);

UPDATE street_neighborhoods SET neighborhood = 'פלורנטין' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'פלורנטין', 'דרום פלורנטין', 'נחלת בנימין'
);

UPDATE street_neighborhoods SET neighborhood = 'כרם התימנים' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'כרם התימנים', 'כרם_התימנים', 'הירקון'
);

UPDATE street_neighborhoods SET neighborhood = 'רמת אביב' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'רמת אביב', 'רמת_אביב', 'רמת אביב החדשה', 'רמת אביב ג',
  'הגוש הגדול', 'הגוש הגדול, רמת אביב החדשה, נופי ים',
  'נופי ים (הגוש הגדול)',
  'נאות אפקה א', 'נאות אפקה ב',
  'אפקה', 'מעוז אביב', 'צוקי אביב'
);
UPDATE street_neighborhoods SET neighborhood = 'רמת אביב' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'רמת אביב ג%';
UPDATE street_neighborhoods SET neighborhood = 'רמת אביב' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'נאות אפקה א%';
UPDATE street_neighborhoods SET neighborhood = 'רמת אביב' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'נאות אפקה ב%';

UPDATE street_neighborhoods SET neighborhood = 'יפו' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'יפו', 'יפו ג', 'יפו ד', 'יפו העתיקה',
  'מרכז יפו', 'חצרות יפו', 'לב יפו',
  'צפון יפו, המושבה האמריקאית-גרמנית', 'שוק הפשפשים וצפון יפו',
  'נוה גולן', 'גבעת הרצל', 'גבעת הרצל, אזור המלאכה יפו',
  'נווה עופר', 'נווה עופר - תל כביר', 'נווה עופר, תל כביר'
);
UPDATE street_neighborhoods SET neighborhood = 'יפו' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'יפו ד%';
UPDATE street_neighborhoods SET neighborhood = 'יפו' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'עג%';
UPDATE street_neighborhoods SET neighborhood = 'יפו' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'נווה גולן%';

UPDATE street_neighborhoods SET neighborhood = 'צהלה' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'צהלה', 'גני צהלה', 'גני צהלה, רמות צהלה', 'רמות צהלה',
  'כוכב הצפון', 'צהלון ושיכוני חסכון', 'צהלון, שיכוני חסכון'
);

UPDATE street_neighborhoods SET neighborhood = 'בבלי' WHERE city = 'תל אביב יפו' AND neighborhood IN ('בבלי', 'שיכון בבלי');

UPDATE street_neighborhoods SET neighborhood = 'תל ברוך' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'תל ברוך', 'תל ברוך צפון',
  'איזור שדה דב', 'שדה דב אשכול', 'גלילות', 'דקר', 'מכללת תל אביב יפו, דקר'
);

UPDATE street_neighborhoods SET neighborhood = 'דרום תל אביב' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'שפירא', 'נווה שאנן', 'נוה שאנן', 'התקווה', 'שכונת התקווה',
  'כפר שלם', 'יד חרוצים',
  'נווה אליעזר', 'נווה אליעזר וכפר שלם מזרח',
  'נווה ברבור, כפר שלם מערב', 'נוה כפיר כפר שלם',
  'כפיר, נווה כפיר', 'נווה כפיר', 'שכונת כפיר',
  'עזרא והארגזים', 'עזרא, הארגזים',
  'נגה', 'קרית שלום', 'צומת חולון',
  'המשתלה', 'ביצרון', 'ביצרון ורמת ישראל', 'רמת ישראל',
  'גבעת רמב"ם'
);
UPDATE street_neighborhoods SET neighborhood = 'דרום תל אביב' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'שיכון עממי%';
UPDATE street_neighborhoods SET neighborhood = 'דרום תל אביב' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'התקוה%';
UPDATE street_neighborhoods SET neighborhood = 'דרום תל אביב' WHERE city = 'תל אביב יפו' AND neighborhood LIKE 'נוה צה%';

UPDATE street_neighborhoods SET neighborhood = 'יד אליהו' WHERE city = 'תל אביב יפו' AND neighborhood = 'יד אליהו';

UPDATE street_neighborhoods SET neighborhood = 'אזורי חן' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'אזורי חן', 'אזורי חן, גימל החדשה', 'נווה חן', 'נוה חן'
);

UPDATE street_neighborhoods SET neighborhood = 'נווה אביבים' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'נווה אביבים', 'נוה אביבים', 'ניר אביב', 'תל חיים'
);

UPDATE street_neighborhoods SET neighborhood = 'הדר יוסף' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'הדר יוסף', 'רמת החייל', 'רמת הטייסים'
);

UPDATE street_neighborhoods SET neighborhood = 'נווה שרת' WHERE city = 'תל אביב יפו' AND neighborhood IN (
  'נווה שרת', 'נוה שרת', 'קרית שאול'
);

UPDATE street_neighborhoods SET neighborhood = 'נחלת יצחק' WHERE city = 'תל אביב יפו' AND neighborhood = 'נחלת יצחק';

UPDATE street_neighborhoods SET neighborhood = 'נווה צדק' WHERE city = 'תל אביב יפו' AND neighborhood = 'נווה צדק';

UPDATE street_neighborhoods SET neighborhood = 'נמל תל אביב' WHERE city = 'תל אביב יפו' AND neighborhood = 'נמל תל אביב';

-- =============================================
-- Update neighborhood_normalized
-- =============================================
UPDATE street_neighborhoods SET neighborhood_normalized = REPLACE(neighborhood, ' ', '_') 
WHERE city = 'תל אביב יפו';

-- =============================================
-- Delete NULL neighborhoods
-- =============================================
DELETE FROM street_neighborhoods WHERE neighborhood IS NULL;

-- =============================================
-- Deduplicate - keep one row per street+city
-- Use a subquery approach instead of nested window functions
-- =============================================
WITH neighborhood_counts AS (
  SELECT street_name, city, neighborhood, COUNT(*) as cnt
  FROM street_neighborhoods
  GROUP BY street_name, city, neighborhood
),
best_neighborhood AS (
  SELECT DISTINCT ON (street_name, city) street_name, city, neighborhood
  FROM neighborhood_counts
  ORDER BY street_name, city, cnt DESC
),
keep_rows AS (
  SELECT DISTINCT ON (sn.street_name, sn.city) sn.id
  FROM street_neighborhoods sn
  JOIN best_neighborhood bn ON sn.street_name = bn.street_name AND sn.city = bn.city AND sn.neighborhood = bn.neighborhood
  ORDER BY sn.street_name, sn.city, sn.confidence DESC NULLS LAST, sn.created_at ASC
)
DELETE FROM street_neighborhoods WHERE id NOT IN (SELECT id FROM keep_rows);

-- Re-add unique constraint (now per street+city only)
ALTER TABLE street_neighborhoods ADD CONSTRAINT street_neighborhoods_unique_street_city 
  UNIQUE (street_name, city);
