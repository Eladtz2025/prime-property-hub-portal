INSERT INTO social_posts (platform, post_type, content_text, hashtags, image_urls, link_url, status, property_id, created_by)
VALUES (
  'facebook_page',
  'property_listing',
  '🏠 בדיקת Link Card - נחום הנביא 13א, תל אביב
🛏️ 2 חדרים | 📐 40 מ"ר
💰 ₪6,500

📞 לפרטים נוספים צרו קשר',
  '#נדלן #דירהלהשכרה #תלאביב',
  '[]'::jsonb,
  'https://www.ctmarketproperties.com/property/d18dc54a-c20d-4977-bd65-a4d01a7819d3',
  'scheduled',
  'd18dc54a-c20d-4977-bd65-a4d01a7819d3',
  'bfd1625c-7bb5-424f-8969-966cbbdd00ef'
) RETURNING id;