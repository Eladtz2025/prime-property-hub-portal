
-- Insert default templates (using a system-level user approach — created_by is nullable)
INSERT INTO public.social_templates (name, platform, post_type, template_text, hashtags, created_by)
VALUES
  ('דירה להשכרה — בסיסי', 'both', 'property_listing',
   E'🏠 דירה להשכרה ב{city}\n\n📍 {address}\n💰 {price} לחודש\n🛏️ {rooms} חדרים\n📐 {size} מ\"ר\n🏢 קומה {floor}\n\n{description}',
   '#נדלן #דירהלהשכרה #{city} #להשכרה', NULL),
  ('דירה למכירה — מפורט', 'both', 'property_listing',
   E'🏠 דירה למכירה ב{neighborhood}, {city}\n\n📍 {address}\n💰 {price}\n🛏️ {rooms} חדרים | 📐 {size} מ\"ר | 🏢 קומה {floor}\n\n{description}\n\n📞 לפרטים נוספים צרו קשר!',
   '#נדלן #דירהלמכירה #{city} #{neighborhood} #למכירה #השקעה', NULL),
  ('פוסט כללי — שיווקי', 'both', 'general_content',
   E'✨ חדש במערכת!\n\nאנחנו שמחים לעדכן ש...\n\n📞 לפרטים נוספים:',
   '#נדלן #חדשות', NULL)
ON CONFLICT DO NOTHING;
