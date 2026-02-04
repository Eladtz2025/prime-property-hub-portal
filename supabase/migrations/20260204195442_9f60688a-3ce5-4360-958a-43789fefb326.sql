-- Update check_tel_aviv_only trigger to set all required fields when marking inactive
CREATE OR REPLACE FUNCTION check_tel_aviv_only()
RETURNS TRIGGER AS $$
DECLARE
  non_ta_cities TEXT[] := ARRAY[
    'באר יעקב', 'ראש העין', 'ירושלים', 'יבנה', 'גני תקווה', 
    'שוהם', 'כפר סבא', 'קרית אונו', 'רמת גן', 'גבעתיים', 
    'חולון', 'בת ים', 'פתח תקווה', 'נתניה', 'מודיעין', 
    'הרצליה', 'רעננה', 'הוד השרון', 'אשדוד', 'ראשון לציון',
    'נס ציונה', 'כפר יונה', 'צור יגאל', 'אלעד', 'בית שמש',
    'פרדס חנה', 'זכרון יעקב', 'נהריה', 'עפולה', 'טבריה',
    'אילת', 'חיפה', 'באר שבע', 'נתיבות', 'אופקים', 'דימונה',
    'ערד', 'לוד', 'רמלה', 'בתלמי מנשה', 'נופרים'
  ];
  city_name TEXT;
BEGIN
  -- Check 1: city field is not Tel Aviv
  IF NEW.city IS NOT NULL 
     AND NEW.city NOT LIKE '%תל אביב%' 
     AND NEW.city NOT LIKE '%תל-אביב%'
     AND NEW.city NOT LIKE '%Tel Aviv%' THEN
    NEW.is_active := false;
    NEW.status := 'inactive';
    NEW.availability_checked_at := now();
    NEW.availability_check_reason := 'non_ta_city_field';
    RETURN NEW;
  END IF;
  
  -- Check 2: address contains a non-Tel Aviv city
  IF NEW.address IS NOT NULL THEN
    FOREACH city_name IN ARRAY non_ta_cities LOOP
      IF NEW.address ILIKE '%' || city_name || '%' THEN
        NEW.is_active := false;
        NEW.status := 'inactive';
        NEW.availability_checked_at := now();
        NEW.availability_check_reason := 'non_ta_city_address';
        RETURN NEW;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;