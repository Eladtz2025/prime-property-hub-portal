-- Insert Ben Yehuda 110 pitch deck into database
INSERT INTO pitch_decks (
  id,
  title,
  slug,
  language,
  is_active,
  views_count,
  theme_color,
  overlay_opacity,
  agent_names,
  contact_phone,
  contact_whatsapp
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Ben Yehuda 110',
  'ben-yehuda-110',
  'en',
  true,
  0,
  '#f5c242',
  0.85,
  'City Market Properties',
  '+972-50-123-4567',
  '+972-50-123-4567'
);

-- Insert slides for Ben Yehuda 110
INSERT INTO pitch_deck_slides (deck_id, slide_type, slide_order, is_visible, slide_data, background_image) VALUES
-- Slide 1: Title
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'title', 1, true, 
'{"title": "BEN YEHUDA 110", "subtitle": "CITY MARKET PROPERTIES", "showDecorations": true}'::jsonb,
'/images/ben-yehuda-110/cleaned-property-image (2).png'),

-- Slide 2: Property Details
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'property', 2, true,
'{"title": "Property Details", "address": "Ben Yehuda 110, Tel Aviv", "price": "₪8,500,000", "size": "120 sqm", "rooms": "4", "floor": "6", "description": "Stunning apartment in the heart of Tel Aviv with panoramic city views"}'::jsonb,
'/images/ben-yehuda-110/cleaned-property-image (2).png'),

-- Slide 3: Features
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'features', 3, true,
'{"title": "Property Features", "features": [{"icon": "sun", "title": "Natural Light", "description": "Floor-to-ceiling windows"}, {"icon": "wind", "title": "Sea Breeze", "description": "Mediterranean views"}, {"icon": "car", "title": "Parking", "description": "Private parking spot"}, {"icon": "shield", "title": "Security", "description": "24/7 doorman"}, {"icon": "home", "title": "Renovated", "description": "Modern finishes"}, {"icon": "trees", "title": "Balcony", "description": "Spacious terrace"}]}'::jsonb,
'/images/ben-yehuda-110/cleaned-property-image (2).png'),

-- Slide 4: Neighborhood
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'neighborhood', 4, true,
'{"title": "The Neighborhood", "description": "Located in the vibrant heart of Tel Aviv", "highlights": ["Walking distance to the beach", "Close to restaurants and cafes", "Near public transportation", "Quiet residential street"]}'::jsonb,
'/images/ben-yehuda-110/cleaned-property-image (2).png'),

-- Slide 5: Pricing Analysis
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'pricing', 5, true,
'{"title": "Market Analysis", "pricePerSqm": "₪70,833", "comparables": [{"address": "Ben Yehuda 95", "price": "₪72,000/sqm"}, {"address": "Dizengoff 150", "price": "₪68,000/sqm"}]}'::jsonb,
'/images/ben-yehuda-110/cleaned-property-image (2).png'),

-- Slide 6: Marketing Strategy
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'marketing', 6, true,
'{"title": "Marketing Strategy", "strategies": ["Professional photography", "Virtual 3D tour", "Premium listing placement", "Social media campaign", "Targeted advertising"]}'::jsonb,
'/images/ben-yehuda-110/cleaned-property-image (2).png'),

-- Slide 7: Timeline
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'timeline', 7, true,
'{"title": "Sales Timeline", "steps": [{"week": "Week 1", "action": "Property preparation & photography"}, {"week": "Week 2", "action": "Listing launch & marketing"}, {"week": "Week 3-4", "action": "Showings & open house"}, {"week": "Week 5-8", "action": "Negotiations & closing"}]}'::jsonb,
'/images/ben-yehuda-110/cleaned-property-image (2).png'),

-- Slide 8: Digital Marketing
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'marketing_ii', 8, true,
'{"title": "Digital Presence", "channels": ["Facebook & Instagram ads", "Google search optimization", "Email marketing", "WhatsApp broadcast", "Premium real estate portals"]}'::jsonb,
'/images/ben-yehuda-110/cleaned-property-image (2).png'),

-- Slide 9: About Us
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'about', 9, true,
'{"title": "About City Market", "description": "Leading real estate agency specializing in premium Tel Aviv properties", "stats": [{"value": "15+", "label": "Years Experience"}, {"value": "500+", "label": "Properties Sold"}, {"value": "98%", "label": "Client Satisfaction"}]}'::jsonb,
'/images/ben-yehuda-110/cleaned-property-image (2).png'),

-- Slide 10: Contact
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'contact', 10, true,
'{"title": "Lets Connect", "phone": "+972-50-123-4567", "email": "info@citymarket.co.il", "whatsapp": "+972-50-123-4567", "callToAction": "Schedule a Viewing Today"}'::jsonb,
'/images/ben-yehuda-110/cleaned-property-image (2).png');