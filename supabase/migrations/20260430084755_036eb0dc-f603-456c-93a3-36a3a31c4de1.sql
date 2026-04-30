UPDATE scouted_properties 
SET availability_check_reason = NULL 
WHERE is_active = true 
  AND availability_check_reason = 'needs_enrichment';