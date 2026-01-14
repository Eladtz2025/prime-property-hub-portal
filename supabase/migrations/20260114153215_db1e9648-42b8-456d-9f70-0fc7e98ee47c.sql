-- Update Neighborhood slide - fix appeals_to from objects to strings
UPDATE pitch_deck_slides 
SET slide_data = jsonb_set(
  slide_data,
  '{appeals_to}',
  '["Lifestyle buyers", "Foreign residents", "Long-term investors"]'::jsonb
)
WHERE id = '13141196-dd9d-4112-9f3a-2902169b1971';

-- Update Pricing slide - add missing fields
UPDATE pitch_deck_slides 
SET slide_data = slide_data || '{
  "price_per_sqm": "₪58K",
  "sales_range": "₪2.9M–5.7M",
  "avg_deal_size": "62 sqm",
  "strategic_points": ["Priced within the active market band", "Reflects current conditions — not peak-cycle pricing"]
}'::jsonb
WHERE id = '1e4e87e5-b520-4dfe-9d95-701030b860b2';

-- Update Marketing slide - add missing fields
UPDATE pitch_deck_slides 
SET slide_data = slide_data || '{
  "visual_strategy": ["Professional photography and video", "Lifestyle-led storytelling"],
  "target_audiences": ["Local lifestyle buyers", "Foreign residents & overseas buyers"],
  "exposure_strategy": ["Curated launch before mass advertising", "Private networks and off-market reach"]
}'::jsonb
WHERE id = 'c0b073be-9a62-4d4a-9369-ee4ff0bb3d93';

-- Update About slide - fix field names
UPDATE pitch_deck_slides 
SET slide_data = jsonb_set(
  jsonb_set(
    slide_data - 'intro_quote',
    '{boutique_quote}',
    '"Selling in prime Tel Aviv requires more than exposure. It requires local intelligence, precise positioning, and human insight."'::jsonb
  ),
  '{team_members}',
  '[
    {"name": "Elad Tzabari", "icon": "Award", "years": "15+", "expertise": "Tel Aviv market expertise"},
    {"name": "Tali Silberberg", "icon": "Globe", "years": "10+", "expertise": "International perspective"}
  ]'::jsonb
)
WHERE id = '1861d60d-ee97-417f-b834-e4cbc6b4dd85';