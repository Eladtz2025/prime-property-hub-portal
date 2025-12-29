-- Add serial property number column
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_number SERIAL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_property_number ON public.properties(property_number);