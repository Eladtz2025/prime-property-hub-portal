-- Add availability check settings to scout_settings (cast to jsonb)
INSERT INTO scout_settings (category, setting_key, setting_value, description) VALUES
('availability', 'min_days_before_check', '3'::jsonb, 'מספר ימים מינימלי לפני בדיקת נכס חדש'),
('availability', 'batch_size', '50'::jsonb, 'כמות נכסים בכל אצווה'),
('availability', 'delay_between_batches_ms', '1500'::jsonb, 'השהייה בין אצוות (מילישניות)'),
('availability', 'delay_between_requests_ms', '150'::jsonb, 'השהייה בין בקשות (מילישניות)'),
('availability', 'head_timeout_ms', '10000'::jsonb, 'זמן המתנה לבקשת HEAD (מילישניות)'),
('availability', 'get_timeout_ms', '8000'::jsonb, 'זמן המתנה לבקשת GET (מילישניות)');