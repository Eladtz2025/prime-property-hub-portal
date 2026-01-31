
-- Fix Dizengoff -> צפון ישן
UPDATE scouted_properties SET 
  neighborhood = 'צפון ישן',
  title = REPLACE(title, 'יפו', 'צפון ישן')
WHERE neighborhood = 'יפו' 
  AND address ILIKE '%דיזנגוף%'
  AND address NOT ILIKE '%יפו ג%'
  AND address NOT ILIKE '%יפו ד%';

-- Fix Arlozorov -> לב העיר
UPDATE scouted_properties SET 
  neighborhood = 'לב העיר',
  title = REPLACE(title, 'יפו', 'לב העיר')
WHERE neighborhood = 'יפו' 
  AND address ILIKE '%ארלוזורוב%';

-- Fix Ibn Gvirol -> מרכז העיר
UPDATE scouted_properties SET 
  neighborhood = 'מרכז העיר',
  title = REPLACE(title, 'יפו', 'מרכז העיר')
WHERE neighborhood = 'יפו' 
  AND address ILIKE '%אבן גבירול%';

-- Fix Kikar HaMedina area
UPDATE scouted_properties SET 
  neighborhood = 'כיכר המדינה',
  title = REPLACE(title, 'יפו', 'כיכר המדינה')
WHERE neighborhood = 'יפו' 
  AND (address ILIKE '%ככר המדינה%' 
       OR address ILIKE '%זבוטינסקי%' 
       OR address ILIKE '%פנקס%');

-- Fix Bitzaron
UPDATE scouted_properties SET 
  neighborhood = 'ביצרון',
  title = REPLACE(title, 'יפו', 'ביצרון')
WHERE neighborhood = 'יפו' 
  AND address ILIKE '%ביצרון%';

-- Fix Sarona
UPDATE scouted_properties SET 
  neighborhood = 'שרונה',
  title = REPLACE(title, 'יפו', 'שרונה')
WHERE neighborhood = 'יפו' 
  AND address ILIKE '%מנחם בגין%';
