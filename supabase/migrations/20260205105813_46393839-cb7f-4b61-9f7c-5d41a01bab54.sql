-- Performance index for cleanup RPC
CREATE INDEX IF NOT EXISTS idx_scouted_duplicate_active
ON scouted_properties(duplicate_group_id)
WHERE is_active = true AND duplicate_group_id IS NOT NULL;

-- Cleanup RPC: reset orphan duplicate groups (properties left alone after others became inactive)
CREATE OR REPLACE FUNCTION cleanup_orphan_duplicate_groups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cleaned INTEGER := 0;
BEGIN
  -- Find properties that have duplicate_group_id but are alone in their group
  -- (all other group members are inactive or deleted)
  UPDATE scouted_properties sp
  SET 
    duplicate_group_id = NULL,
    is_primary_listing = true,
    duplicate_detected_at = NULL
  WHERE sp.duplicate_group_id IS NOT NULL
    AND sp.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM scouted_properties sp2
      WHERE sp2.duplicate_group_id = sp.duplicate_group_id
        AND sp2.id != sp.id
        AND sp2.is_active = true
    );
  
  GET DIAGNOSTICS v_cleaned = ROW_COUNT;
  
  RETURN v_cleaned;
END;
$$;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION cleanup_orphan_duplicate_groups TO service_role;

-- Schedule hourly cleanup cron job
SELECT cron.schedule(
  'cleanup-orphan-duplicates-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/cleanup-orphan-duplicates',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);