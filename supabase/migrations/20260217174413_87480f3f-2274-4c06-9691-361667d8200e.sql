INSERT INTO feature_flags (name, is_enabled, description)
VALUES ('process_backfill_jina', true, 'Kill switch for Jina data completion backfill')
ON CONFLICT (name) DO NOTHING;