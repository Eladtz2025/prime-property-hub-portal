UPDATE scouted_properties
SET availability_checked_at = NULL,
    availability_check_reason = NULL
WHERE availability_checked_at >= '2025-03-19'
  AND is_active = true
  AND availability_check_reason IN (
    'madlan_direct_status_403',
    'madlan_direct_status_520', 
    'per_property_timeout',
    'check_error',
    'rate_limited',
    'madlan_blocked_retry'
  );