-- Add price flexibility settings for matching (cast to jsonb)
INSERT INTO scout_settings (category, setting_key, setting_value, description) VALUES
('matching', 'rent_flex_low_threshold', to_jsonb(7000), 'סף תחתון לזליגה גבוהה (השכרה)'),
('matching', 'rent_flex_low_percent', to_jsonb(0.15), 'אחוז זליגה עד סף תחתון'),
('matching', 'rent_flex_mid_threshold', to_jsonb(15000), 'סף עליון לזליגה בינונית (השכרה)'),
('matching', 'rent_flex_mid_percent', to_jsonb(0.10), 'אחוז זליגה בין הסףים'),
('matching', 'rent_flex_high_percent', to_jsonb(0.08), 'אחוז זליגה מעל סף עליון')
ON CONFLICT (category, setting_key) DO NOTHING;