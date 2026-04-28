UPDATE scouted_properties 
SET availability_checked_at = NULL,
    availability_check_count = 0
WHERE source = 'madlan' 
  AND is_active = true 
  AND availability_check_reason IN ('madlan_direct_status_403','madlan_direct_status_520');