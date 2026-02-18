UPDATE scouted_properties
SET availability_checked_at = NULL, 
    availability_check_reason = NULL, 
    availability_check_count = 0
WHERE source = 'madlan' 
  AND is_active = true
  AND availability_check_reason IN (
    'madlan_skeleton', 'madlan_homepage_redirect', 
    'madlan_captcha_blocked', 'per_property_timeout',
    'jina_failed_after_retries'
  );