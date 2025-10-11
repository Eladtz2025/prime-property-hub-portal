-- Add additional images to rental properties

-- דיזנגוף 125 - דירת 4 חדרים
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/living-bauhaus-1.jpg',
  'סלון מרווח',
  false,
  1
FROM properties WHERE address = 'דיזנגוף 125, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bedroom-master-1.jpg',
  'חדר שינה ראשי',
  false,
  2
FROM properties WHERE address = 'דיזנגוף 125, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bathroom-modern-1.jpg',
  'חדר רחצה מודרני',
  false,
  3
FROM properties WHERE address = 'דיזנגוף 125, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/balcony-sunny-1.jpg',
  'מרפסת משמשת',
  false,
  4
FROM properties WHERE address = 'דיזנגוף 125, תל אביב'
ON CONFLICT DO NOTHING;

-- בן יהודה 43 - דירת 3 חדרים
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/living-bauhaus-1.jpg',
  'סלון',
  false,
  1
FROM properties WHERE address = 'בן יהודה 43, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bedroom-master-1.jpg',
  'חדר שינה',
  false,
  2
FROM properties WHERE address = 'בן יהודה 43, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bathroom-modern-1.jpg',
  'חדר רחצה',
  false,
  3
FROM properties WHERE address = 'בן יהודה 43, תל אביב'
ON CONFLICT DO NOTHING;

-- גורדון 18 - דירת 3 חדרים
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/living-bauhaus-1.jpg',
  'סלון מואר',
  false,
  1
FROM properties WHERE address = 'גורדון 18, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bathroom-modern-1.jpg',
  'חדר רחצה',
  false,
  2
FROM properties WHERE address = 'גורדון 18, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/balcony-sunny-1.jpg',
  'מרפסת',
  false,
  3
FROM properties WHERE address = 'גורדון 18, תל אביב'
ON CONFLICT DO NOTHING;

-- פרישמן 45 - סטודיו
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bathroom-modern-1.jpg',
  'חדר רחצה',
  false,
  1
FROM properties WHERE address = 'פרישמן 45, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/office-home-1.jpg',
  'פינת עבודה',
  false,
  2
FROM properties WHERE address = 'פרישמן 45, תל אביב'
ON CONFLICT DO NOTHING;

-- ביאליק 12 - דירת 2 חדרים
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/living-bauhaus-1.jpg',
  'סלון',
  false,
  1
FROM properties WHERE address = 'ביאליק 12, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bedroom-master-1.jpg',
  'חדר שינה',
  false,
  2
FROM properties WHERE address = 'ביאליק 12, תל אביב'
ON CONFLICT DO NOTHING;

-- רוטשילד 88 - דירת 5 חדרים (מכירה)
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/living-bauhaus-1.jpg',
  'סלון יוקרתי',
  false,
  1
FROM properties WHERE address = 'רוטשילד 88, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bedroom-master-1.jpg',
  'חדר שינה ראשי',
  false,
  2
FROM properties WHERE address = 'רוטשילד 88, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bathroom-modern-1.jpg',
  'חדר רחצה',
  false,
  3
FROM properties WHERE address = 'רוטשילד 88, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/balcony-sunny-1.jpg',
  'מרפסת',
  false,
  4
FROM properties WHERE address = 'רוטשילד 88, תל אביב'
ON CONFLICT DO NOTHING;

-- אלנבי 234 - פנטהאוז
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/living-bauhaus-1.jpg',
  'סלון פנטהאוז',
  false,
  1
FROM properties WHERE address = 'אלנבי 234, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bedroom-master-1.jpg',
  'חדר שינה',
  false,
  2
FROM properties WHERE address = 'אלנבי 234, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bathroom-modern-1.jpg',
  'חדר רחצה יוקרתי',
  false,
  3
FROM properties WHERE address = 'אלנבי 234, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/balcony-sunny-1.jpg',
  'גג פרטי',
  false,
  4
FROM properties WHERE address = 'אלנבי 234, תל אביב'
ON CONFLICT DO NOTHING;

-- נחמני 14 - דירת באוהאוס
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/living-bauhaus-1.jpg',
  'סלון בסגנון באוהאוס',
  false,
  1
FROM properties WHERE address = 'נחמני 14, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/building-bauhaus-1.jpg',
  'בניין באוהאוס',
  false,
  2
FROM properties WHERE address = 'נחמני 14, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bedroom-master-1.jpg',
  'חדר שינה',
  false,
  3
FROM properties WHERE address = 'נחמני 14, תל אביב'
ON CONFLICT DO NOTHING;

-- דיזנגוף 201 - דירת 4 חדרים למכירה
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/living-bauhaus-1.jpg',
  'סלון מרווח',
  false,
  1
FROM properties WHERE address = 'דיזנגוף 201, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bedroom-master-1.jpg',
  'חדר שינה',
  false,
  2
FROM properties WHERE address = 'דיזנגוף 201, תל אביב'
ON CONFLICT DO NOTHING;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT 
  id,
  '/images/properties/bathroom-modern-1.jpg',
  'חדר רחצה',
  false,
  3
FROM properties WHERE address = 'דיזנגוף 201, תל אביב'
ON CONFLICT DO NOTHING;