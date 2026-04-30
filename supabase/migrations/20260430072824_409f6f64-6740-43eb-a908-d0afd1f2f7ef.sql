-- ============================================
-- 1. Table: own_property_matches
-- Stores matches between our properties (properties table) and leads
-- ============================================
CREATE TABLE IF NOT EXISTS public.own_property_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.contact_leads(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 100,
  priority INTEGER NOT NULL DEFAULT 0,
  match_reasons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_own_property_matches_lead
  ON public.own_property_matches(lead_id);
CREATE INDEX IF NOT EXISTS idx_own_property_matches_property
  ON public.own_property_matches(property_id);
CREATE INDEX IF NOT EXISTS idx_own_property_matches_priority
  ON public.own_property_matches(lead_id, priority DESC, match_score DESC);

ALTER TABLE public.own_property_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view own_property_matches"
  ON public.own_property_matches
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages own_property_matches"
  ON public.own_property_matches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_own_property_matches_updated_at
  BEFORE UPDATE ON public.own_property_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. RPC: get_unified_customer_matches
-- Unifies scouted_properties matches + own_property_matches
-- ============================================
CREATE OR REPLACE FUNCTION public.get_unified_customer_matches(
  customer_uuid UUID,
  include_dismissed BOOLEAN DEFAULT false
)
RETURNS TABLE(
  id UUID,
  source_table TEXT,
  title TEXT,
  city TEXT,
  neighborhood TEXT,
  address TEXT,
  price INTEGER,
  rooms NUMERIC,
  size INTEGER,
  source TEXT,
  source_url TEXT,
  is_private BOOLEAN,
  property_type TEXT,
  match_score INTEGER,
  priority INTEGER,
  match_reasons TEXT[],
  duplicate_group_id UUID,
  is_dismissed BOOLEAN,
  duplicates_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Source 1: scouted_properties (existing logic, preserved)
  SELECT
    sp.id,
    'scouted'::TEXT AS source_table,
    sp.title,
    sp.city,
    sp.neighborhood,
    sp.address,
    sp.price,
    sp.rooms,
    sp.size,
    sp.source,
    sp.source_url,
    sp.is_private,
    sp.property_type,
    (ml->>'score')::INTEGER AS match_score,
    COALESCE((ml->>'priority')::INTEGER, 0) AS priority,
    ARRAY(SELECT jsonb_array_elements_text(ml->'reasons')) AS match_reasons,
    sp.duplicate_group_id,
    EXISTS (
      SELECT 1 FROM dismissed_matches dm
      WHERE dm.lead_id = customer_uuid AND dm.scouted_property_id = sp.id
    ) AS is_dismissed,
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM scouted_properties dup
       WHERE dup.duplicate_group_id = sp.duplicate_group_id AND dup.is_active = true),
      1
    ) AS duplicates_count,
    sp.created_at
  FROM scouted_properties sp,
       LATERAL (
         SELECT ml_item AS ml FROM jsonb_array_elements(sp.matched_leads) ml_item
         WHERE (ml_item->>'lead_id')::UUID = customer_uuid LIMIT 1
       ) matched
  WHERE sp.is_active = true
    AND sp.price IS NOT NULL AND sp.price > 0
    AND (sp.duplicate_group_id IS NULL OR sp.is_primary_listing = true)
    AND (
      include_dismissed = true
      OR NOT EXISTS (
        SELECT 1 FROM dismissed_matches dm
        WHERE dm.lead_id = customer_uuid AND dm.scouted_property_id = sp.id
      )
    )

  UNION ALL

  -- Source 2: own properties (our internal listings)
  SELECT
    p.id,
    'own'::TEXT AS source_table,
    p.title,
    p.city,
    p.neighborhood,
    p.address,
    COALESCE(p.monthly_rent, p.current_market_value)::INTEGER AS price,
    p.rooms,
    p.property_size::INTEGER AS size,
    'internal'::TEXT AS source,
    NULL::TEXT AS source_url,
    NULL::BOOLEAN AS is_private,
    CASE
      WHEN p.property_type = 'rental' THEN 'rent'
      WHEN p.property_type = 'sale' THEN 'sale'
      ELSE p.property_type
    END AS property_type,
    opm.match_score,
    opm.priority,
    opm.match_reasons,
    NULL::UUID AS duplicate_group_id,
    EXISTS (
      SELECT 1 FROM dismissed_matches dm
      WHERE dm.lead_id = customer_uuid AND dm.property_id = p.id
    ) AS is_dismissed,
    1 AS duplicates_count,
    p.created_at
  FROM own_property_matches opm
  JOIN properties p ON p.id = opm.property_id
  WHERE opm.lead_id = customer_uuid
    AND p.available = true
    AND (
      include_dismissed = true
      OR NOT EXISTS (
        SELECT 1 FROM dismissed_matches dm
        WHERE dm.lead_id = customer_uuid AND dm.property_id = p.id
      )
    )

  ORDER BY priority DESC NULLS LAST,
           match_score DESC NULLS LAST,
           created_at DESC;
END;
$$;