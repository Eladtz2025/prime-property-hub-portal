
-- Add dedup_checked_at column to scouted_properties
ALTER TABLE public.scouted_properties 
ADD COLUMN IF NOT EXISTS dedup_checked_at timestamptz;

-- Add availability_check_count column to scouted_properties
ALTER TABLE public.scouted_properties 
ADD COLUMN IF NOT EXISTS availability_check_count integer NOT NULL DEFAULT 0;

-- Index for dedup unchecked properties
CREATE INDEX IF NOT EXISTS idx_scouted_properties_dedup_unchecked 
ON public.scouted_properties (dedup_checked_at) 
WHERE is_active = true AND dedup_checked_at IS NULL;

-- Index for availability recheck logic
CREATE INDEX IF NOT EXISTS idx_scouted_properties_avail_recheck 
ON public.scouted_properties (availability_check_count, availability_checked_at) 
WHERE is_active = true;

-- Initialize check_count for already-checked properties
UPDATE public.scouted_properties 
SET availability_check_count = 1 
WHERE availability_checked_at IS NOT NULL AND availability_check_count = 0;

-- Add new availability settings
INSERT INTO public.scout_settings (category, setting_key, setting_value, description)
VALUES 
  ('availability', 'first_recheck_interval_days', '8', 'ימים עד recheck ראשון אחרי בדיקה ראשונה'),
  ('availability', 'recurring_recheck_interval_days', '2', 'ימים בין rechecks חוזרים (אחרי הראשון)')
ON CONFLICT DO NOTHING;

-- Create RPC for smart availability fetch (complex OR not possible with supabase-js)
CREATE OR REPLACE FUNCTION public.get_properties_needing_availability_check(
  p_first_recheck_days integer DEFAULT 8,
  p_recurring_recheck_days integer DEFAULT 2,
  p_min_days_before_check integer DEFAULT 3,
  p_fetch_limit integer DEFAULT 150
)
RETURNS TABLE(id uuid) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.id
  FROM scouted_properties sp
  WHERE sp.is_active = true
    AND sp.status IN ('matched', 'new')
    AND sp.first_seen_at < (now() - (p_min_days_before_check || ' days')::interval)
    AND (
      -- Never checked
      sp.availability_checked_at IS NULL
      -- First recheck after initial check
      OR (sp.availability_check_count = 1 
          AND sp.availability_checked_at < now() - (p_first_recheck_days || ' days')::interval)
      -- Recurring rechecks
      OR (sp.availability_check_count >= 2 
          AND sp.availability_checked_at < now() - (p_recurring_recheck_days || ' days')::interval)
    )
  ORDER BY sp.availability_checked_at ASC NULLS FIRST
  LIMIT p_fetch_limit;
$$;
