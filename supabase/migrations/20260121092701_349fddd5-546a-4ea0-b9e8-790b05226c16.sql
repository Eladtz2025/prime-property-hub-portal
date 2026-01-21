-- Create street_neighborhoods table for street-to-neighborhood mapping
CREATE TABLE public.street_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  street_name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'תל אביב יפו',
  neighborhood TEXT NOT NULL,
  neighborhood_normalized TEXT,
  confidence INTEGER DEFAULT 1,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(street_name, city)
);

-- Enable RLS
ALTER TABLE public.street_neighborhoods ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read street_neighborhoods"
  ON public.street_neighborhoods
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage
CREATE POLICY "Admins can manage street_neighborhoods"
  ON public.street_neighborhoods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create index for fast lookups
CREATE INDEX idx_street_neighborhoods_lookup 
  ON public.street_neighborhoods(street_name, city);

-- Add trigger for updated_at
CREATE TRIGGER update_street_neighborhoods_updated_at
  BEFORE UPDATE ON public.street_neighborhoods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Populate table from existing scouted_properties data
-- For each street, use the most common neighborhood
INSERT INTO public.street_neighborhoods (street_name, city, neighborhood, confidence)
SELECT DISTINCT ON (street_name)
  street_name,
  'תל אביב יפו' as city,
  neighborhood,
  count as confidence
FROM (
  SELECT 
    TRIM(REGEXP_REPLACE(address, '[0-9].*$', '')) as street_name,
    neighborhood,
    COUNT(*) as count
  FROM scouted_properties 
  WHERE city = 'תל אביב יפו' 
    AND address IS NOT NULL 
    AND neighborhood IS NOT NULL
    AND TRIM(address) != ''
    AND TRIM(REGEXP_REPLACE(address, '[0-9].*$', '')) != ''
    AND LENGTH(TRIM(REGEXP_REPLACE(address, '[0-9].*$', ''))) > 2
    AND TRIM(REGEXP_REPLACE(address, '[0-9].*$', '')) !~ '^https?://'
    AND TRIM(REGEXP_REPLACE(address, '[0-9].*$', '')) !~ '^www\.'
    AND TRIM(REGEXP_REPLACE(address, '[0-9].*$', '')) !~ '^[A-Za-z0-9\s]+$'
  GROUP BY TRIM(REGEXP_REPLACE(address, '[0-9].*$', '')), neighborhood
) sub
WHERE street_name IS NOT NULL
ORDER BY street_name, count DESC
ON CONFLICT (street_name, city) DO NOTHING;