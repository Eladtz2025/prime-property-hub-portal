
-- Update detect_duplicates_batch to use dedup_checked_at instead of duplicate_group_id IS NULL
-- and include inactive properties
CREATE OR REPLACE FUNCTION public.detect_duplicates_batch(batch_size integer DEFAULT 500)
 RETURNS TABLE(duplicates_found integer, groups_created integer, properties_processed integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_duplicates_found INTEGER := 0;
  v_groups_created INTEGER := 0;
  v_processed INTEGER := 0;
  rec RECORD;
  match_id UUID;
  match_group UUID;
BEGIN
  FOR rec IN
    SELECT sp.id, sp.address, sp.city, sp.rooms, sp.floor, sp.size, sp.property_type
    FROM public.scouted_properties sp
    WHERE sp.dedup_checked_at IS NULL
      AND sp.address IS NOT NULL AND sp.address <> ''
      AND sp.rooms IS NOT NULL
      AND sp.city IS NOT NULL
      AND sp.property_type IS NOT NULL
    ORDER BY sp.created_at ASC
    LIMIT batch_size
  LOOP
    v_processed := v_processed + 1;

    -- Always mark as checked, even if no duplicate found
    UPDATE public.scouted_properties
    SET dedup_checked_at = NOW()
    WHERE id = rec.id;

    SELECT d.id, d.duplicate_group_id
      INTO match_id, match_group
    FROM public.find_property_duplicate(
      rec.address,
      rec.city,
      rec.rooms,
      rec.floor,
      rec.size::INTEGER,
      rec.property_type,
      rec.id
    ) d
    LIMIT 1;

    IF match_id IS NOT NULL THEN
      v_duplicates_found := v_duplicates_found + 1;

      IF match_group IS NULL THEN
        match_group := match_id;
        v_groups_created := v_groups_created + 1;

        UPDATE public.scouted_properties
        SET duplicate_group_id = match_group,
            duplicate_detected_at = NOW(),
            dedup_checked_at = NOW()
        WHERE id = match_id;
      END IF;

      UPDATE public.scouted_properties
      SET duplicate_group_id = match_group,
          duplicate_detected_at = NOW()
      WHERE id = rec.id;
    END IF;
  END LOOP;

  IF v_duplicates_found > 0 OR v_groups_created > 0 THEN
    PERFORM public.recompute_duplicate_winners();
  END IF;

  RETURN QUERY SELECT v_duplicates_found, v_groups_created, v_processed;
END;
$function$;
