-- Fix all Tel Aviv variations to canonical form in preferred_cities
UPDATE contact_leads
SET preferred_cities = (
  SELECT array_agg(DISTINCT 
    CASE 
      WHEN city IN ('תל אביב', 'תלאביב', 'TelAviv', 'Tel Aviv', 'תא') THEN 'תל אביב יפו'
      ELSE city
    END
  )
  FROM unnest(preferred_cities) AS city
)
WHERE preferred_cities && ARRAY['תל אביב', 'תלאביב', 'TelAviv', 'Tel Aviv', 'תא']::text[];