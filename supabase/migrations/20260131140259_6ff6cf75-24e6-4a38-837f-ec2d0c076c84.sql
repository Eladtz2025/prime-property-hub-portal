-- Deactivate the Bat Yam property
UPDATE scouted_properties
SET is_active = false
WHERE id = 'f7dd66e1-eefe-4558-99c6-d4d810591b2c';

-- Stop the stuck backfill task (use 'completed' which is a valid status)
UPDATE backfill_progress
SET 
  status = 'completed',
  completed_at = NOW(),
  updated_at = NOW(),
  error_message = 'Manually stopped - was stuck'
WHERE id = '88907474-9435-440f-ac68-f516ecff9594'
  AND status = 'running';

-- Deactivate ANY non-Tel Aviv properties (safety net)
UPDATE scouted_properties
SET is_active = false
WHERE is_active = true
  AND city IS NOT NULL
  AND city NOT LIKE '%תל אביב%'
  AND city NOT LIKE '%תל-אביב%'
  AND city NOT LIKE '%Tel Aviv%';

-- Create trigger to prevent non-Tel Aviv properties
CREATE OR REPLACE FUNCTION check_tel_aviv_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip check if city is null (will be filled by backfill)
  IF NEW.city IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if city is Tel Aviv
  IF NEW.city NOT LIKE '%תל אביב%' 
     AND NEW.city NOT LIKE '%תל-אביב%'
     AND NEW.city NOT LIKE '%Tel Aviv%' THEN
    -- Instead of error, just mark as inactive
    NEW.is_active := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_tel_aviv_only ON scouted_properties;
CREATE TRIGGER enforce_tel_aviv_only
  BEFORE INSERT OR UPDATE ON scouted_properties
  FOR EACH ROW
  EXECUTE FUNCTION check_tel_aviv_only();