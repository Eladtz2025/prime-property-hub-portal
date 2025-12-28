-- Add agent_signature column to brokerage_forms table
ALTER TABLE public.brokerage_forms 
ADD COLUMN IF NOT EXISTS agent_signature text;