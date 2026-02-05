-- 1. Create availability_check_runs table for locking
CREATE TABLE IF NOT EXISTS availability_check_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  properties_checked INTEGER DEFAULT 0,
  inactive_marked INTEGER DEFAULT 0,
  error_message TEXT
);

-- Index for quick lock lookup
CREATE INDEX idx_availability_runs_status ON availability_check_runs(status, started_at);

-- 2. Trigger to prevent content_ok overwriting inactive properties
CREATE OR REPLACE FUNCTION prevent_content_ok_on_inactive()
RETURNS TRIGGER AS $$
BEGIN
  -- If OLD was already inactive and NEW tries to set content_ok, keep OLD reason
  IF OLD.is_active = false AND NEW.availability_check_reason = 'content_ok' THEN
    NEW.availability_check_reason := OLD.availability_check_reason;
  END IF;
  
  -- Ensure status consistency when inactive
  IF NEW.is_active = false AND (NEW.status IS NULL OR NEW.status != 'inactive') THEN
    NEW.status := 'inactive';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_inactive_consistency ON scouted_properties;
CREATE TRIGGER ensure_inactive_consistency
BEFORE UPDATE ON scouted_properties
FOR EACH ROW
EXECUTE FUNCTION prevent_content_ok_on_inactive();

-- 3. One-time fix for existing inconsistent records
UPDATE scouted_properties
SET 
  availability_check_reason = 'legacy_race_condition_fixed',
  status = 'inactive'
WHERE is_active = false 
  AND availability_check_reason = 'content_ok';