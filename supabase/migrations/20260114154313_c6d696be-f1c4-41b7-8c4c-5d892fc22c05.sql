
-- Insert step1_pricing slide for Ben Yehuda 110 New presentation
INSERT INTO pitch_deck_slides (deck_id, slide_type, slide_order, is_visible, slide_data)
VALUES (
  'a4921ef4-198f-4f8a-a3f7-9c0e793de07c',
  'step1_pricing',
  11,
  true,
  '{
    "title": "Pricing Strategy",
    "subtitle": "Market Analysis & Recommended Positioning",
    "option_a_price": "₪4,250,000",
    "option_a_description": "Premium price reflecting prime location and high-end renovation",
    "option_a_months_min": 7,
    "option_a_months_max": 11,
    "option_b_price": "₪3,950,000",
    "option_b_description": "Competitive price for faster market absorption",
    "option_b_months_min": 3,
    "option_b_months_max": 5,
    "recently_sold": [
      {"address": "Ben Yehuda 98", "price": "₪3,800,000", "size": "85 sqm"},
      {"address": "Dizengoff 120", "price": "₪4,100,000", "size": "92 sqm"},
      {"address": "Gordon 45", "price": "₪4,500,000", "size": "105 sqm"}
    ],
    "currently_for_sale": [
      {"address": "Ben Yehuda 125", "price": "₪4,200,000", "size": "90 sqm"},
      {"address": "Frishman 30", "price": "₪3,900,000", "size": "82 sqm"}
    ]
  }'::jsonb
);
