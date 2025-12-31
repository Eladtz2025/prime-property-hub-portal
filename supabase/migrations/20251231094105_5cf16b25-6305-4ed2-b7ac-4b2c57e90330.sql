-- Add display_type field to price_offers table
ALTER TABLE public.price_offers 
ADD COLUMN IF NOT EXISTS display_type TEXT NOT NULL DEFAULT 'standard' 
CHECK (display_type IN ('standard', 'luxury'));