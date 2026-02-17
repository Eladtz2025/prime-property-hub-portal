INSERT INTO feature_flags (name, is_enabled, description)
VALUES ('process_scans_jina', true, 'Kill switch for Jina-based property scanning')
ON CONFLICT (name) DO NOTHING;