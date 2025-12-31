-- Create a sample luxury price offer
DO $$
DECLARE
  new_offer_id UUID := gen_random_uuid();
  new_token TEXT := encode(gen_random_bytes(16), 'hex');
  images_block_id UUID := gen_random_uuid();
  text_block_1_id UUID := gen_random_uuid();
  text_block_2_id UUID := gen_random_uuid();
  text_block_3_id UUID := gen_random_uuid();
  map_block_id UUID := gen_random_uuid();
BEGIN
  -- Insert the luxury price offer
  INSERT INTO public.price_offers (
    id,
    token,
    property_title,
    property_details,
    display_type,
    language,
    is_active,
    suggested_price_min,
    suggested_price_max,
    price_per_sqm_min,
    price_per_sqm_max,
    expected_income_min,
    expected_income_max,
    created_by
  ) VALUES (
    new_offer_id,
    new_token,
    'פנטהאוז יוקרתי במגדלי הים, תל אביב',
    'פנטהאוז מרהיב בקומה 35 עם נוף פנורמי לים התיכון | 220 מ״ר בנוי + 80 מ״ר מרפסות | 5 חדרים | גימור ברמה הגבוהה ביותר',
    'luxury',
    'he',
    true,
    12000000,
    12500000,
    54000,
    57000,
    32000,
    35000,
    (SELECT id FROM profiles LIMIT 1)
  );

  -- Insert image block
  INSERT INTO public.price_offer_blocks (id, offer_id, block_type, block_order, block_data) VALUES
  (images_block_id, new_offer_id, 'images', 1, '{"title": "גלריית תמונות"}'::jsonb);

  -- Insert text block - About the property
  INSERT INTO public.price_offer_blocks (id, offer_id, block_type, block_order, block_data) VALUES
  (text_block_1_id, new_offer_id, 'text', 2, '{
    "title": "הנכס",
    "content": "פנטהאוז יוקרתי ומרווח בקומה ה-35 של מגדל היוקרה הבולט ביותר בקו החוף של תל אביב.\n\nהדירה כוללת סלון ענק עם חלונות מהרצפה עד התקרה, מטבח שף מאובזר במכשירי חשמל מהשורה הראשונה, סוויטת מאסטר עם חדר ארונות וחדר רחצה ספא.\n\nהגימור ברמה הגבוהה ביותר: פרקט אלון אירופאי, חיפוי שיש איטלקי, תאורה אדריכלית ומערכות בית חכם."
  }'::jsonb);

  -- Insert text block - About the area
  INSERT INTO public.price_offer_blocks (id, offer_id, block_type, block_order, block_data) VALUES
  (text_block_2_id, new_offer_id, 'text', 3, '{
    "title": "האזור",
    "content": "מגדלי הים ממוקמים בלב קו החוף היוקרתי של תל אביב, במרחק הליכה קצר מחוף פרישמן ומשדרות רוטשילד.\n\nהשכונה מציעה את הטוב ביותר שיש לעיר להציע: מסעדות שף, בוטיקים יוקרתיים, גלריות אמנות, ובתי קפה תוססים.\n\nנגישות מצוינת לכבישי הגישה המרכזיים ותחבורה ציבורית."
  }'::jsonb);

  -- Insert text block - Why buy here
  INSERT INTO public.price_offer_blocks (id, offer_id, block_type, block_order, block_data) VALUES
  (text_block_3_id, new_offer_id, 'text', 4, '{
    "title": "למה לרכוש כאן?",
    "content": "• נוף פנורמי בלתי נחסם לים התיכון\n• מיקום פריים בלב תל אביב\n• בניין יוקרה עם קונסיירז׳ 24/7\n• חניון פרטי ל-3 רכבים\n• בריכת אינסוף על הגג\n• חדר כושר פרטי לדיירים\n• אבטחה ברמה הגבוהה ביותר\n• פוטנציאל השכרה גבוה מאוד"
  }'::jsonb);

  -- Insert map block
  INSERT INTO public.price_offer_blocks (id, offer_id, block_type, block_order, block_data) VALUES
  (map_block_id, new_offer_id, 'map', 5, '{
    "title": "מיקום הנכס",
    "address": "הירקון 150, תל אביב יפו",
    "latitude": 32.0853,
    "longitude": 34.7818
  }'::jsonb);

  -- Insert sample images (using Unsplash)
  INSERT INTO public.price_offer_images (offer_id, block_id, image_url, image_order) VALUES
  (new_offer_id, images_block_id, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80', 1),
  (new_offer_id, images_block_id, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80', 2),
  (new_offer_id, images_block_id, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80', 3),
  (new_offer_id, images_block_id, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80', 4),
  (new_offer_id, images_block_id, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=80', 5);

  -- Output the token for easy access
  RAISE NOTICE 'Created luxury offer with token: %', new_token;
END $$;