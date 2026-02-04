-- 1. Normalize is_active: set NULL to true
UPDATE scouted_properties SET is_active = true WHERE is_active IS NULL;

-- 2. Add availability tracking columns
ALTER TABLE scouted_properties
ADD COLUMN IF NOT EXISTS availability_checked_at timestamptz,
ADD COLUMN IF NOT EXISTS availability_check_reason text;

COMMENT ON COLUMN scouted_properties.availability_checked_at IS 'Last availability check timestamp';
COMMENT ON COLUMN scouted_properties.availability_check_reason IS 'Reason/result of last availability check';

-- 3. Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_scouted_properties_availability_check 
ON scouted_properties (is_active, status, first_seen_at, availability_checked_at)
WHERE is_active = true;

-- 4. Add new availability settings
INSERT INTO scout_settings (category, setting_key, setting_value, description)
VALUES 
  ('availability', 'daily_limit', '1200', 'Maximum properties to check per day'),
  ('availability', 'recheck_interval_days', '7', 'Days to wait before rechecking a property'),
  ('availability', 'firecrawl_max_retries', '3', 'Number of retry attempts for Firecrawl errors'),
  ('availability', 'firecrawl_retry_delay_ms', '2000', 'Delay between retry attempts (ms)')
ON CONFLICT (category, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- 5. Update batch_size to 25
UPDATE scout_settings 
SET setting_value = '25' 
WHERE category = 'availability' AND setting_key = 'batch_size';