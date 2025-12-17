-- Add co-brokerage status column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS co_brokerage_status TEXT DEFAULT 'not_open';

-- Add comment for documentation
COMMENT ON COLUMN public.properties.co_brokerage_status IS 'Co-brokerage status: not_open, coop_25, coop_33, coop_50, by_agreement';