-- Add created_by column to contact_leads
ALTER TABLE public.contact_leads 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing records: copy assigned_agent_id to created_by where it exists
UPDATE public.contact_leads 
SET created_by = assigned_agent_id 
WHERE assigned_agent_id IS NOT NULL AND created_by IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_contact_leads_created_by ON public.contact_leads(created_by);