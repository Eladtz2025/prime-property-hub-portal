CREATE OR REPLACE FUNCTION public.get_deal_listings(
  p_property_type text DEFAULT 'rent',
  p_limit int DEFAULT 100,
  p_min_discount numeric DEFAULT 0.15,
  p_max_discount numeric DEFAULT 0.40
)
RETURNS TABLE (
  id uuid,
  title text,
  source text,
  source_url text,
  city text,
  neighborhood text,
  address text,
  property_type text,
  price integer,
  rooms numeric,
  size integer,
  floor integer,
  is_private boolean,
  first_seen_at timestamptz,
  created_at timestamptz,
  price_per_sqm integer,
  median_per_sqm integer,
  discount_pct numeric,
  deal_tier text,
  deal_score integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH whitelist AS (
    SELECT unnest(ARRAY[
      'מרכז העיר','לב העיר','לב תל אביב',
      'צפון ישן','הצפון הישן',
      'רוטשילד','נווה צדק','כרם התימנים'
    ]) AS nb
  ),
  benchmarks AS (
    SELECT 
      sp.neighborhood,
      sp.property_type,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY sp.price::numeric / NULLIF(sp.size,0)) AS median_pps
    FROM scouted_properties sp
    WHERE sp.is_active = true
      AND sp.price IS NOT NULL AND sp.price > 0
      AND sp.size IS NOT NULL AND sp.size > 0
      AND sp.neighborhood IN (SELECT nb FROM whitelist)
      AND sp.property_type = p_property_type
      AND sp.created_at >= now() - interval '90 days'
    GROUP BY sp.neighborhood, sp.property_type
    HAVING COUNT(*) >= 5
  ),
  candidates AS (
    SELECT
      sp.id, sp.title, sp.source, sp.source_url, sp.city, sp.neighborhood,
      sp.address, sp.property_type, sp.price, sp.rooms, sp.size, sp.floor,
      sp.is_private, sp.first_seen_at, sp.created_at,
      (sp.price::numeric / sp.size)::int AS pps,
      b.median_pps::int AS med_pps,
      ((b.median_pps - (sp.price::numeric / sp.size)) / NULLIF(b.median_pps,0))::numeric AS disc
    FROM scouted_properties sp
    JOIN benchmarks b 
      ON b.neighborhood = sp.neighborhood 
     AND b.property_type = sp.property_type
    WHERE sp.is_active = true
      AND sp.property_type = p_property_type
      AND sp.price IS NOT NULL AND sp.size IS NOT NULL
      AND sp.size > 0 AND sp.rooms IS NOT NULL
      AND sp.neighborhood IN (SELECT nb FROM whitelist)
      AND (sp.duplicate_group_id IS NULL OR sp.is_primary_listing = true)
      AND CASE 
            WHEN p_property_type = 'rent' THEN sp.price >= 3000
            WHEN p_property_type = 'sale' THEN sp.price >= 800000
            ELSE true
          END
      AND sp.first_seen_at >= now() - interval '21 days'
  )
  SELECT
    c.id, c.title, c.source, c.source_url, c.city, c.neighborhood,
    c.address, c.property_type, c.price, c.rooms, c.size, c.floor,
    c.is_private, c.first_seen_at, c.created_at,
    c.pps AS price_per_sqm,
    c.med_pps AS median_per_sqm,
    ROUND(c.disc, 3) AS discount_pct,
    CASE WHEN c.disc >= 0.25 THEN 'strong' ELSE 'regular' END AS deal_tier,
    LEAST(100, GREATEST(0, ROUND(
      (LEAST(c.disc, 0.40) * 60 / 0.40 * 100 / 100 * 60) +
      (CASE 
         WHEN c.first_seen_at >= now() - interval '24 hours' THEN 25
         WHEN c.first_seen_at >= now() - interval '72 hours' THEN 15
         WHEN c.first_seen_at >= now() - interval '7 days' THEN 7
         ELSE 0
       END) +
      (CASE 
         WHEN c.is_private = true THEN 15
         WHEN c.is_private IS NULL THEN 7
         ELSE 0
       END)
    )::int)) AS deal_score
  FROM candidates c
  WHERE c.disc >= p_min_discount AND c.disc <= p_max_discount
  ORDER BY 
    CASE WHEN c.disc >= 0.25 THEN 0 ELSE 1 END,
    c.disc DESC,
    c.first_seen_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_deal_listings(text, int, numeric, numeric) TO authenticated;