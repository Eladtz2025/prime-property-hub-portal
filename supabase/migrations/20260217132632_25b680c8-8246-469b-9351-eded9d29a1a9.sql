
UPDATE scout_settings SET setting_value = '25000' WHERE category = 'availability' AND setting_key = 'per_property_timeout_ms';
UPDATE scout_settings SET setting_value = '2' WHERE category = 'availability' AND setting_key = 'concurrency_limit';
