-- Add raw_text column to store original markdown/html for future reclassification
ALTER TABLE public.scouted_properties
ADD COLUMN IF NOT EXISTS raw_text text;