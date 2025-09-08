-- Create rent_payments table for tracking rent payments
CREATE TABLE public.rent_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  notes TEXT,
  receipt_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tenant_communications table for messages
CREATE TABLE public.tenant_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  subject TEXT,
  communication_type TEXT NOT NULL DEFAULT 'message' CHECK (communication_type IN ('message', 'maintenance_request', 'notice', 'reminder')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_rent_payments_tenant_id ON public.rent_payments(tenant_id);
CREATE INDEX idx_rent_payments_property_id ON public.rent_payments(property_id);
CREATE INDEX idx_rent_payments_due_date ON public.rent_payments(due_date);
CREATE INDEX idx_tenant_communications_tenant_id ON public.tenant_communications(tenant_id);
CREATE INDEX idx_tenant_communications_property_id ON public.tenant_communications(property_id);

-- Enable RLS on new tables
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_communications ENABLE ROW LEVEL SECURITY;

-- RLS policies for rent_payments
CREATE POLICY "Property owners can view their rent payments" 
ON public.rent_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM property_owners po 
    WHERE po.property_id = rent_payments.property_id 
    AND po.owner_id = auth.uid()
  ) OR 
  get_current_user_role() = ANY(ARRAY['admin', 'super_admin', 'manager'])
);

CREATE POLICY "Property owners can create rent payments" 
ON public.rent_payments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM property_owners po 
    WHERE po.property_id = rent_payments.property_id 
    AND po.owner_id = auth.uid()
  ) OR 
  get_current_user_role() = ANY(ARRAY['admin', 'super_admin', 'manager'])
);

CREATE POLICY "Property owners can update their rent payments" 
ON public.rent_payments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM property_owners po 
    WHERE po.property_id = rent_payments.property_id 
    AND po.owner_id = auth.uid()
  ) OR 
  get_current_user_role() = ANY(ARRAY['admin', 'super_admin', 'manager'])
);

-- RLS policies for tenant_communications
CREATE POLICY "Property owners can view their tenant communications" 
ON public.tenant_communications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM property_owners po 
    WHERE po.property_id = tenant_communications.property_id 
    AND po.owner_id = auth.uid()
  ) OR 
  get_current_user_role() = ANY(ARRAY['admin', 'super_admin', 'manager'])
);

CREATE POLICY "Property owners can create tenant communications" 
ON public.tenant_communications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM property_owners po 
    WHERE po.property_id = tenant_communications.property_id 
    AND po.owner_id = auth.uid()
  ) OR 
  get_current_user_role() = ANY(ARRAY['admin', 'super_admin', 'manager'])
);

CREATE POLICY "Property owners can update their tenant communications" 
ON public.tenant_communications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM property_owners po 
    WHERE po.property_id = tenant_communications.property_id 
    AND po.owner_id = auth.uid()
  ) OR 
  get_current_user_role() = ANY(ARRAY['admin', 'super_admin', 'manager'])
);

-- Add updated_at trigger for rent_payments
CREATE TRIGGER update_rent_payments_updated_at
  BEFORE UPDATE ON public.rent_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();