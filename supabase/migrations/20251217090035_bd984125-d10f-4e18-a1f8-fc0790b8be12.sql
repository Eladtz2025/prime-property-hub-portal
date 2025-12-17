-- Create table to track sent lease expiry alerts
CREATE TABLE public.lease_expiry_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  days_before INTEGER NOT NULL, -- 60 or 30
  lease_end_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  whatsapp_sent BOOLEAN DEFAULT false,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate alerts for same property/tenant/days_before combination
  UNIQUE(property_id, tenant_id, days_before, lease_end_date)
);

-- Enable RLS
ALTER TABLE public.lease_expiry_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all alerts
CREATE POLICY "Admins can manage lease expiry alerts"
ON public.lease_expiry_alerts
FOR ALL
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Create index for faster queries
CREATE INDEX idx_lease_expiry_alerts_property ON public.lease_expiry_alerts(property_id);
CREATE INDEX idx_lease_expiry_alerts_tenant ON public.lease_expiry_alerts(tenant_id);
CREATE INDEX idx_lease_expiry_alerts_sent_at ON public.lease_expiry_alerts(sent_at DESC);