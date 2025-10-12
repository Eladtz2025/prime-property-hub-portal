-- Create brokerage forms table
CREATE TABLE public.brokerage_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  form_date DATE NOT NULL,
  referred_by TEXT,
  fee_type_rental BOOLEAN DEFAULT false,
  fee_type_sale BOOLEAN DEFAULT false,
  special_terms TEXT,
  properties JSONB DEFAULT '[]'::jsonb,
  client_name TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  client_signature TEXT NOT NULL,
  status TEXT DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE public.brokerage_forms ENABLE ROW LEVEL SECURITY;

-- Admins can manage all forms
CREATE POLICY "Admins can manage all brokerage forms"
ON public.brokerage_forms
FOR ALL
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Users can create forms
CREATE POLICY "Users can create brokerage forms"
ON public.brokerage_forms
FOR INSERT
WITH CHECK (true);

-- Users can view their own forms
CREATE POLICY "Users can view their brokerage forms"
ON public.brokerage_forms
FOR SELECT
USING (created_by = auth.uid() OR get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Trigger for updated_at
CREATE TRIGGER update_brokerage_forms_updated_at
BEFORE UPDATE ON public.brokerage_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();