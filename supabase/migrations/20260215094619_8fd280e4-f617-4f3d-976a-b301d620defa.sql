-- Reset properties falsely marked inactive by old aggressive HEAD/redirect/HTTP logic
-- These will be re-checked with the new text-only detection
UPDATE scouted_properties
SET 
  is_active = true,
  status = 'new',
  availability_checked_at = NULL,
  availability_check_reason = NULL,
  availability_check_count = 0
WHERE is_active = false
  AND availability_check_reason IN (
    'head_redirect_away',
    'head_redirect_to_home',
    'head_http_404',
    'head_http_410',
    'http_404',
    'http_410',
    'empty_or_error_page',
    'homepage_or_error_detected'
  );