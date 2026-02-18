
CREATE OR REPLACE FUNCTION public.get_properties_needing_availability_check(p_first_recheck_days integer DEFAULT 8, p_recurring_recheck_days integer DEFAULT 2, p_min_days_before_check integer DEFAULT 3, p_fetch_limit integer DEFAULT 150)
 RETURNS TABLE(id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Round-robin across sources to ensure all sites get checked equally
  WITH eligible AS (
    SELECT sp.id, sp.source,
           ROW_NUMBER() OVER (PARTITION BY sp.source ORDER BY sp.availability_checked_at ASC NULLS FIRST) as rn
    FROM scouted_properties sp
    WHERE sp.is_active = true
      AND sp.status IN ('matched', 'new')
      AND sp.first_seen_at < (now() - (p_min_days_before_check || ' days')::interval)
      AND (sp.duplicate_group_id IS NULL OR sp.is_primary_listing = true)
      AND (
        sp.availability_checked_at IS NULL
        OR (sp.availability_check_count = 1 
            AND sp.availability_checked_at < now() - (p_first_recheck_days || ' days')::interval)
        OR (sp.availability_check_count >= 2 
            AND sp.availability_checked_at < now() - (p_recurring_recheck_days || ' days')::interval)
      )
  )
  SELECT eligible.id
  FROM eligible
  ORDER BY eligible.rn ASC, eligible.source ASC
  LIMIT p_fetch_limit;
$function$;
