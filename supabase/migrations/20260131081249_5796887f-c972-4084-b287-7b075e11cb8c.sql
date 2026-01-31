-- Revert the flip for properties scanned today (after parser fix was deployed)
-- The parser was fixed, so today's data was correct - the migration wrongly flipped it
UPDATE public.scouted_properties
SET is_private = NOT is_private
WHERE created_at::date = CURRENT_DATE
AND is_private IS NOT NULL;