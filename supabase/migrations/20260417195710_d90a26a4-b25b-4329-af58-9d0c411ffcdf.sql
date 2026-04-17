UPDATE scouted_properties
SET availability_checked_at = NULL,
    availability_check_reason = NULL
WHERE is_active = true
  AND backfill_status = 'failed';