-- Create bulk_sends table for tracking bulk WhatsApp messages
CREATE TABLE public.bulk_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  template_id UUID REFERENCES message_templates(id),
  recipient_count INTEGER NOT NULL,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  recipient_phones TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.bulk_sends ENABLE ROW LEVEL SECURITY;

-- Admins can manage all bulk sends
CREATE POLICY "Admins can manage all bulk sends"
ON public.bulk_sends
FOR ALL
TO authenticated
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Users can view their own bulk sends
CREATE POLICY "Users can view their own bulk sends"
ON public.bulk_sends
FOR SELECT
TO authenticated
USING (sent_by = auth.uid());

-- Users can create their own bulk sends
CREATE POLICY "Users can create their own bulk sends"
ON public.bulk_sends
FOR INSERT
TO authenticated
WITH CHECK (sent_by = auth.uid());