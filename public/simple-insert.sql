-- Simple insert script for City Market Properties
-- Make sure to run this in Supabase SQL Editor

-- Clear any test data first (optional)
-- DELETE FROM property_images;
-- DELETE FROM properties WHERE address LIKE '%רוטשילד%' OR address LIKE '%בזל%';

-- Insert rental properties
INSERT INTO properties (
  title, address, city, property_type, monthly_rent, 
  rooms, bathrooms, property_size, floor, building_floors,
  parking, elevator, balcony, featured, available, description
) VALUES 
(
  'דירת 3 חדרים מרווחת ברוטשילד',
  'רוטשילד 45',
  'תל אביב',
  'rental',
  8500,
  3,
  2,
  95,
  3,
  5,
  true,
  true,
  true,
  true,
  true,
  'דירה מרווחת ומוארת בלב שדרות רוטשילד. שופצה לאחרונה, מטבח חדש.'
),
(
  'פנטהאוז יוקרתי 5 חדרים',
  'אלנבי 88',
  'תל אביב',
  'rental',
  15000,
  5,
  3,
  150,
  6,
  6,
  true,
  true,
  true,
  true,
  true,
  'פנטהאוז מרהיב עם מרפסת גג ענקית ונוף פנורמי.'
),
(
  'דירת 2 חדרים בדיזנגוף',
  'דיזנגוף 120',
  'תל אביב',
  'rental',
  6500,
  2,
  1,
  70,
  4,
  5,
  false,
  true,
  true,
  false,
  true,
  'דירה מעוצבת במיקום מעולה ליד הים. מושלמת לזוג צעיר.'
);

-- Insert sales properties
INSERT INTO properties (
  title, address, city, property_type, monthly_rent,
  rooms, bathrooms, property_size, floor, building_floors,
  parking, elevator, balcony, featured, available, description
) VALUES
(
  'וילה יוקרתית 6 חדרים',
  'השלום 15',
  'הרצליה',
  'sale',
  8500000,
  6,
  4,
  280,
  NULL,
  2,
  true,
  false,
  true,
  true,
  true,
  'וילה יוקרתית עם בריכה פרטית וגינה מעוצבת.'
),
(
  'פנטהאוז 5 חדרים בבזל',
  'בזל 24',
  'תל אביב',
  'sale',
  6200000,
  5,
  3,
  160,
  8,
  8,
  true,
  true,
  true,
  true,
  true,
  'פנטהאוז עם מרפסת גג ענקית ונוף פנורמי.'
);

-- Insert management property
INSERT INTO properties (
  title, address, city, property_type,
  property_size, building_floors,
  parking, elevator, available, description
) VALUES
(
  'בניין 12 יחידות - ניהול מלא',
  'שינקין 56',
  'תל אביב',
  'management',
  850,
  4,
  true,
  true,
  true,
  'בניין מנוהל עם 12 יחידות דיור. שירותי ניהול מלאים.'
);