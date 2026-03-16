
-- Restore properties falsely marked inactive by the size heuristic
UPDATE scouted_properties 
SET 
  is_active = true,
  status = 'new',
  availability_check_reason = 'restored_false_positive_size_heuristic',
  availability_checked_at = NULL,
  availability_check_count = 0
WHERE source = 'madlan' 
  AND is_active = false 
  AND availability_check_reason = 'listing_removed_homepage_size';
