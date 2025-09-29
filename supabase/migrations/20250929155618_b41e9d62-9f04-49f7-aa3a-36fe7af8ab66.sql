-- Add contact information columns to whatsapp_messages table (if they don't exist)
ALTER TABLE public.whatsapp_messages 
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS contact_type text CHECK (contact_type IN ('tenant', 'owner'));

-- Add index for better performance when filtering by contact type
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_type ON public.whatsapp_messages(contact_type);