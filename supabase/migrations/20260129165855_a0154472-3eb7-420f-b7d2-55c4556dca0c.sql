-- 1. Delete records without addresses
DELETE FROM scouted_properties
WHERE address IS NULL OR address = '' OR TRIM(address) = '';

-- 2. Delete project listings (based on title only)
DELETE FROM scouted_properties
WHERE title ILIKE '%פרויקט%' 
   OR title ILIKE '%בנייה חדשה%';

-- 3. Fix remaining broker names in city field
UPDATE scouted_properties
SET city = NULL
WHERE city ~* '(remax|רימקס|morgan|מורגן|נדל"ן|נדלן|realestate|real estate|השקעות|homes|assets|אסטייט|estate)'
   OR city IN ('Liron', 'גדי', 'MORE', 'Mare');

-- 4. Extract city from address for records missing city
UPDATE scouted_properties
SET city = CASE
  WHEN address ILIKE '%תל אביב%' OR address ILIKE '%תל-אביב%' THEN 'תל אביב'
  WHEN address ILIKE '%רמת גן%' OR address ILIKE '%רמת-גן%' THEN 'רמת גן'
  WHEN address ILIKE '%גבעתיים%' THEN 'גבעתיים'
  WHEN address ILIKE '%הרצליה%' THEN 'הרצליה'
  WHEN address ILIKE '%רעננה%' THEN 'רעננה'
  WHEN address ILIKE '%כפר סבא%' OR address ILIKE '%כפר-סבא%' THEN 'כפר סבא'
  WHEN address ILIKE '%פתח תקווה%' OR address ILIKE '%פתח-תקווה%' THEN 'פתח תקווה'
  WHEN address ILIKE '%ראשון לציון%' OR address ILIKE '%ראשל"צ%' THEN 'ראשון לציון'
  WHEN address ILIKE '%חולון%' THEN 'חולון'
  WHEN address ILIKE '%בת ים%' OR address ILIKE '%בת-ים%' THEN 'בת ים'
  WHEN address ILIKE '%נתניה%' THEN 'נתניה'
  WHEN address ILIKE '%אשדוד%' THEN 'אשדוד'
  WHEN address ILIKE '%באר שבע%' OR address ILIKE '%באר-שבע%' THEN 'באר שבע'
  WHEN address ILIKE '%חיפה%' THEN 'חיפה'
  WHEN address ILIKE '%ירושלים%' THEN 'ירושלים'
  WHEN address ILIKE '%בני ברק%' OR address ILIKE '%בני-ברק%' THEN 'בני ברק'
  WHEN address ILIKE '%הוד השרון%' THEN 'הוד השרון'
  WHEN address ILIKE '%רחובות%' THEN 'רחובות'
  WHEN address ILIKE '%נס ציונה%' THEN 'נס ציונה'
  WHEN address ILIKE '%אור יהודה%' THEN 'אור יהודה'
  WHEN address ILIKE '%יהוד%' THEN 'יהוד'
  ELSE city
END
WHERE city IS NULL AND address IS NOT NULL;