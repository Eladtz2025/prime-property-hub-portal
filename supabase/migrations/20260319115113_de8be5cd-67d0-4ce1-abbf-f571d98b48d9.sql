UPDATE scouted_properties
SET availability_checked_at = NULL,
    availability_check_reason = NULL,
    availability_check_count = GREATEST(availability_check_count - 1, 0)
WHERE source = 'madlan'
  AND is_active = true
  AND availability_check_reason = 'content_ok'
  AND availability_checked_at >= '2025-03-19'::date;