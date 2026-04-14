INSERT INTO social_posts (platform, post_type, content_text, hashtags, image_urls, status, property_id, created_by)
VALUES (
  'facebook_page',
  'property_listing',
  '🏠 בדיקת פרסום - נחום הנביא 13א, תל אביב
🛏️ 2 חדרים | 📐 40 מ"ר
💰 ₪6,500

📞 לפרטים נוספים צרו קשר

https://www.ctmarketproperties.com/property/d18dc54a-c20d-4977-bd65-a4d01a7819d3',
  '#נדלן #דירהלהשכרה #תלאביב',
  '["https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/1770196494547_jr72p.jpg","https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/1767356500327_m9nsk.jpg","https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/1770196845962_03vrmt.jpg","https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/1770196911501_21pysv.jpg"]'::jsonb,
  'scheduled',
  'd18dc54a-c20d-4977-bd65-a4d01a7819d3',
  'bfd1625c-7bb5-424f-8969-966cbbdd00ef'
) RETURNING id;