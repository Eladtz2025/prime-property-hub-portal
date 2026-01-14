
-- Insert step1_pricing slide for Zlatopolsky presentation
INSERT INTO pitch_deck_slides (deck_id, slide_type, slide_order, is_visible, slide_data)
VALUES (
  'd218891c-c4d7-4661-8e3a-59cf70e0863a',
  'step1_pricing',
  10,
  true,
  '{
    "title": "אסטרטגיית תמחור",
    "subtitle": "ניתוח שוק ומיצוב מומלץ",
    "option_a_price": "",
    "option_a_description": "",
    "option_a_months_min": 0,
    "option_a_months_max": 0,
    "option_b_price": "",
    "option_b_description": "",
    "option_b_months_min": 0,
    "option_b_months_max": 0,
    "recently_sold": [],
    "currently_for_sale": []
  }'::jsonb
);
