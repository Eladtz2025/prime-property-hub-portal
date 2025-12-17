-- Add English translation columns to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS neighborhood_en TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.properties.title_en IS 'Property title in English';
COMMENT ON COLUMN public.properties.description_en IS 'Property description in English';
COMMENT ON COLUMN public.properties.neighborhood_en IS 'Neighborhood name in English';