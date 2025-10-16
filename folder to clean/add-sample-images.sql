-- Add sample images to existing properties
-- First, let's get the property IDs and add titles to them

-- Update existing rental properties with titles and details
UPDATE properties 
SET 
  title = 'דירת 2 חדרים מרווחת בבן יהודה',
  description = 'דירה מקסימה במיקום מעולה ליד הים. משופצת, מוארת, מתאימה לזוג או רווקים.',
  rooms = 2,
  bathrooms = 1,
  property_size = 65,
  parking = false,
  elevator = true,
  balcony = true,
  featured = false
WHERE address = 'בן יהודה 178' AND city = 'תל אביב';

UPDATE properties 
SET 
  title = 'דירת 3 חדרים בבבלי',
  description = 'דירה שקטה ומרווחת באזור מבוקש. 3 חדרים גדולים, מטבח מאובזר.',
  rooms = 3,
  bathrooms = 1,
  property_size = 85,
  parking = true,
  elevator = false,
  balcony = true,
  featured = false
WHERE address = 'בבלי 35' AND city = 'תל אביב-יפו';

UPDATE properties 
SET 
  title = 'דירה מרווחת בהירקון',
  description = 'דירה עם נוף לים בשדרת הירקון. מיקום מעולה, קרוב לחוף.',
  rooms = 3,
  bathrooms = 2,
  property_size = 90,
  parking = true,
  elevator = true,
  balcony = true,
  featured = true
WHERE address = 'הירקון 171' AND city = 'תל אביב-יפו';

-- Now add images to properties
-- Note: Replace the property IDs with actual IDs from your database

-- For rental property 1
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/properties/2br-bialik.jpg', 'דירת 2 חדרים', true, 0
FROM properties WHERE address = 'בן יהודה 178' LIMIT 1;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/properties/balcony-sunny-1.jpg', 'מרפסת שמשית', false, 1
FROM properties WHERE address = 'בן יהודה 178' LIMIT 1;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/properties/bedroom-master-1.jpg', 'חדר שינה', false, 2
FROM properties WHERE address = 'בן יהודה 178' LIMIT 1;

-- For rental property 2
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/properties/building-bauhaus-1.jpg', 'בניין באוהאוס', true, 0
FROM properties WHERE address = 'בבלי 35' LIMIT 1;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/properties/bathroom-modern-1.jpg', 'חדר רחצה מודרני', false, 1
FROM properties WHERE address = 'בבלי 35' LIMIT 1;

-- For rental property 3 (featured)
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/rental-interior.jpg', 'סלון מפואר', true, 0
FROM properties WHERE address = 'הירקון 171' LIMIT 1;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/properties/balcony-sunny-1.jpg', 'מרפסת עם נוף', false, 1
FROM properties WHERE address = 'הירקון 171' LIMIT 1;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/properties/bedroom-master-1.jpg', 'חדר שינה ראשי', false, 2
FROM properties WHERE address = 'הירקון 171' LIMIT 1;

-- Add a few more sample properties if needed
INSERT INTO properties (title, address, city, property_type, monthly_rent, rooms, bathrooms, property_size, floor, building_floors, parking, elevator, balcony, featured, available, description)
VALUES 
  ('פנטהאוז יוקרתי 5 חדרים', 'רוטשילד 88', 'תל אביב', 'rental', 15000, 5, 3, 150, 6, 6, true, true, true, true, true, 'פנטהאוז מרהיב עם מרפסת גג ענקית. נוף 360 מעלות למרכז העיר והים.');

-- Add images to the penthouse
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/rental-interior.jpg', 'סלון פנטהאוז', true, 0
FROM properties WHERE title = 'פנטהאוז יוקרתי 5 חדרים' LIMIT 1;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/properties/balcony-sunny-1.jpg', 'מרפסת גג', false, 1
FROM properties WHERE title = 'פנטהאוז יוקרתי 5 חדרים' LIMIT 1;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/properties/bedroom-master-1.jpg', 'חדר שינה ראשי', false, 2
FROM properties WHERE title = 'פנטהאוז יוקרתי 5 חדרים' LIMIT 1;

-- Add sales properties
INSERT INTO properties (title, address, city, property_type, monthly_rent, rooms, bathrooms, property_size, floor, building_floors, parking, elevator, balcony, featured, available, description)
VALUES 
  ('וילה יוקרתית 6 חדרים', 'השלום 15', 'הרצליה', 'sale', 8500000, 6, 4, 280, NULL, 2, true, false, true, true, true, 'וילה יוקרתית עם בריכה פרטית וגינה מעוצבת. מטבח שף, 4 חדרי רחצה, סלון גדול.'),
  ('פנטהאוז מרהיב בבזל', 'בזל 24', 'תל אביב', 'sale', 6200000, 5, 3, 160, 8, 8, true, true, true, true, true, 'פנטהאוז עם מרפסת גג ענקית ונוף פנורמי. שופץ ברמה הגבוהה ביותר.');

-- Add images to sales properties
INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/sales-villa.jpg', 'וילה יוקרתית', true, 0
FROM properties WHERE title = 'וילה יוקרתית 6 חדרים' LIMIT 1;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/rental-interior.jpg', 'פנטהאוז למכירה', true, 0
FROM properties WHERE title = 'פנטהאוז מרהיב בבזל' LIMIT 1;

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/properties/balcony-sunny-1.jpg', 'מרפסת גג', false, 1
FROM properties WHERE title = 'פנטהאוז מרהיב בבזל' LIMIT 1;

-- Add management property
INSERT INTO properties (title, address, city, property_type, rooms, property_size, building_floors, parking, elevator, available, description)
VALUES 
  ('בניין 12 יחידות - ניהול מלא', 'שינקין 56', 'תל אביב', 'management', NULL, 850, 4, true, true, true, 'בניין מנוהל עם 12 יחידות דיור. שירותי ניהול מלאים.');

INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
SELECT id, '/images/management-lobby.jpg', 'לובי הבניין', true, 0
FROM properties WHERE title = 'בניין 12 יחידות - ניהול מלא' LIMIT 1;