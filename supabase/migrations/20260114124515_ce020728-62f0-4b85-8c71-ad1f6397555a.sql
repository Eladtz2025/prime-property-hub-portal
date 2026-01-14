-- Fix Yaki's invalid neighborhood (מרכז-קוהים doesn't exist)
UPDATE contact_leads 
SET preferred_neighborhoods = NULL,
    matching_status = 'missing_neighborhoods',
    notes = COALESCE(notes, '') || E'\n[אוטומטי] נמחקה שכונה לא תקינה: מרכז-קוהים'
WHERE id = '5d496077-f059-4653-8938-bccf029a84b8';

-- Fix Uri's city (תלאביב -> תל אביב יפו)
UPDATE contact_leads
SET preferred_cities = ARRAY['תל אביב יפו']
WHERE id = '99f8f35b-6e93-4cd1-98d7-4ac91ff90b02'
AND preferred_cities = ARRAY['תלאביב'];