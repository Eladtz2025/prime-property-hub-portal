UPDATE scouted_properties 
SET is_active = false, 
    status = 'inactive', 
    availability_check_reason = 'madlan_homepage_redirect',
    availability_checked_at = now()
WHERE id = '064a8633-c064-45e8-9631-51080c6ae516';