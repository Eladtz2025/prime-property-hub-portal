-- One-time data fix: reset Yad2-style "weak features" properties back to pending
-- so the nightly Jina backfill picks them up and fills the missing features
-- (aircon, elevator, balcony, mamad, furnished, renovated) from the inner page.
UPDATE scouted_properties
SET backfill_status = 'pending',
    updated_at = NOW()
WHERE is_active = true
  AND backfill_status = 'not_needed'
  AND (
    features IS NULL
    OR jsonb_typeof(features) <> 'object'
    OR (
      (SELECT COUNT(*) FROM jsonb_object_keys(features)) < 3
      AND NOT (features ?| ARRAY['mamad','elevator','aircon','balcony','furnished','renovated'])
    )
  );