-- Add yard and balcony_yard_size columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS yard boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS balcony_yard_size numeric;