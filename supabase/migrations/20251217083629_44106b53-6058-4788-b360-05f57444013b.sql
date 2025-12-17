-- Add show_on_website field to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS show_on_website boolean DEFAULT true;

-- Update existing available properties to show on website
UPDATE public.properties 
SET show_on_website = true 
WHERE available = true AND status IN ('vacant', 'unknown');

-- Update existing rented properties to not show on website by default
UPDATE public.properties 
SET show_on_website = false 
WHERE status = 'occupied';

COMMENT ON COLUMN public.properties.show_on_website IS 'Controls whether the property appears on the public website regardless of status';