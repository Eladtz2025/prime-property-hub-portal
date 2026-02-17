INSERT INTO feature_flags (name, is_enabled, description)
VALUES ('process_availability_jina', true, 'Kill switch for Jina availability check')
ON CONFLICT (name) DO NOTHING;