-- Sample Properties Data for City Market Real Estate
-- Run this SQL in Supabase SQL Editor to populate the database with sample properties

-- Insert sample rental properties
INSERT INTO properties (title, address, city, property_type, monthly_rent, rooms, bathrooms, property_size, floor, building_floors, parking, elevator, balcony, featured, available, description)
VALUES 
  ('דירת 3 חדרים מרווחת ברוטשילד', 'שדרות רוטשילד 45', 'תל אביב', 'rental', 8500, 3, 2, 95, 3, 5, true, true, true, true, true, 'דירה מרווחת ומוארת בלב שדרות רוטשילד. שופצה לאחרונה, מטבח חדש, חדרי רחצה מודרניים. נוף מדהים, מיקום מעולה ליד כל השירותים.'),
  ('דירת גן 4 חדרים בדיזנגוף', 'רחוב דיזנגוף 120', 'תל אביב', 'rental', 12000, 4, 2, 120, 0, 4, true, false, true, true, true, 'דירת גן יוקרתית עם גינה פרטית גדולה. 4 חדרים מרווחים, 2 חדרי רחצה, מטבח גדול. מיקום מעולה ליד הים.'),
  ('סטודיו מעוצב בנחלת בנימין', 'נחלת בנימין 8', 'תל אביב', 'rental', 4200, 1, 1, 35, 2, 3, false, false, true, false, true, 'סטודיו מעוצב בסגנון בוהמייני, ממוקם באזור התוסס של נחלת בנימין. מושלם לרווקים או זוגות צעירים.'),
  ('דירת 2 חדרים בבן יהודה', 'בן יהודה 78', 'תל אביב', 'rental', 6200, 2, 1, 65, 4, 5, false, true, true, false, true, 'דירה מקסימה במיקום מעולה ליד הים. משופצת, מוארת, מתאימה לזוג או רווקים.'),
  ('פנטהאוז 5 חדרים באלנבי', 'אלנבי 88', 'תל אביב', 'rental', 15000, 5, 3, 150, 6, 6, true, true, true, true, true, 'פנטהאוז יוקרתי עם מרפסת גג ענקית. נוף 360 מעלות, מושלם לאירוח. שופץ ברמה הגבוהה ביותר.');

-- Insert sample sales properties  
INSERT INTO properties (title, address, city, property_type, monthly_rent, rooms, bathrooms, property_size, floor, building_floors, parking, elevator, balcony, featured, available, description)
VALUES 
  ('וילה יוקרתית 6 חדרים', 'רחוב השלום 15', 'הרצליה', 'sale', 8500000, 6, 4, 280, NULL, 2, true, false, true, true, true, 'וילה יוקרתית עם בריכה פרטית וגינה מעוצבת. 6 חדרים מרווחים, 4 חדרי רחצה, מטבח שף, סלון גדול עם תקרה גבוהה.'),
  ('פנטהאוז 5 חדרים בבזל', 'רחוב בזל 24', 'תל אביב', 'sale', 6200000, 5, 3, 160, 8, 8, true, true, true, true, true, 'פנטהאוז מרהיב עם מרפסת גג ענקית ונוף פנורמי. שופץ ברמה גבוהה, מטבח איטלקי, חדרי רחצה יוקרתיים.'),
  ('דירת 4 חדרים ברחוב ביאליק', 'רחוב ביאליק 18', 'תל אביב', 'sale', 3800000, 4, 2, 110, 2, 4, true, true, false, false, true, 'דירה בבניין באוהאוס משופץ. תקרות גבוהות, אור טבעי, במיקום מעולף בלב העיר הלבנה.'),
  ('דופלקס 6 חדרים בגורדון', 'גורדון 45', 'תל אביב', 'sale', 5500000, 6, 3, 180, 4, 5, true, true, true, true, true, 'דופלקס מרווח ומואר. קומה עליונה פרטית עם יחידת הורים. נוף לים, מיקום פרימיום.'),
  ('דירת 3 חדרים קלאסית', 'רחוב נחמני 22', 'תל אביב', 'sale', 3200000, 3, 1, 80, 1, 3, false, false, true, false, true, 'דירה קלאסית בבניין באוהאוס אותנטי. פוטנציאל עצום, מתאימה גם להשקעה.');

-- Insert sample management properties
INSERT INTO properties (title, address, city, property_type, rooms, property_size, building_floors, parking, elevator, available, description)
VALUES 
  ('בניין 12 יחידות - ניהול מלא', 'רחוב שינקין 56', 'תל אביב', 'management', NULL, 850, 4, true, true, true, 'בניין מנוהל עם 12 יחידות דיור. שירותי ניהול מלאים: תחזוקה, גביה, דיווח חודשי, טיפול בדיירים.'),
  ('קומפלקס דירות יוקרה', 'הירקון 200', 'תל אביב', 'management', NULL, 1200, 6, true, true, true, 'קומפלקס יוקרתי עם 18 יחידות דיור. כולל לובי מפואר, מערכות אבטחה מתקדמות, שירותי ניהול VIP.'),
  ('בניין משרדים 8 קומות', 'רחוב לילינבלום 34', 'תל אביב', 'management', NULL, 2400, 8, true, true, true, 'בניין משרדים מודרני. ניהול מקצועי של כל המערכות, תחזוקה שוטפת, ניקיון יומי.');

-- Note: After inserting properties, you'll need to add images to property_images table
-- Example:
-- INSERT INTO property_images (property_id, image_url, alt_text, is_main, order_index)
-- VALUES 
--   ('<property-uuid>', '/images/properties/2br-bialik.jpg', 'דירת 2 חדרים ביאליק', true, 0),
--   ('<property-uuid>', '/images/properties/balcony-sunny-1.jpg', 'מרפסת שמשית', false, 1);
