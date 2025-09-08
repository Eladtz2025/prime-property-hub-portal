-- Fix permissions table constraint first
ALTER TABLE public.permissions DROP CONSTRAINT permissions_role_check;
ALTER TABLE public.permissions ADD CONSTRAINT permissions_role_check 
  CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer', 'property_owner'));

-- Phase 1: Database Foundation for Owner Portal

-- Create properties table to replace JSON data
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  property_size NUMERIC,
  floor INTEGER,
  rooms INTEGER,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('unknown', 'occupied', 'vacant', 'maintenance')),
  contact_status TEXT NOT NULL DEFAULT 'not_contacted' CHECK (contact_status IN ('not_contacted', 'called_no_answer', 'called_answered', 'needs_callback')),
  last_contact_date TIMESTAMP WITH TIME ZONE,
  contact_notes TEXT,
  contact_attempts INTEGER NOT NULL DEFAULT 0,
  acquisition_cost NUMERIC,
  renovation_costs NUMERIC,
  current_market_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_owners table for many-to-many relationship
CREATE TABLE public.property_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ownership_percentage NUMERIC DEFAULT 100 CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, owner_id)
);

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  lease_start_date DATE,
  lease_end_date DATE,
  monthly_rent NUMERIC,
  deposit_amount NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_records table for income/expense tracking
CREATE TABLE public.financial_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL, -- rent, maintenance, insurance, taxes, utilities, etc.
  amount NUMERIC NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  receipt_url TEXT, -- link to receipt/document in storage
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_documents table
CREATE TABLE public.property_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('contract', 'image', 'certificate', 'invoice', 'lease', 'insurance', 'other')),
  file_url TEXT NOT NULL, -- storage bucket URL
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lease_expiry', 'rent_due', 'maintenance', 'document_upload', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT, -- optional link for action
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_invitations table for owner invitations
CREATE TABLE public.property_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  property_ids UUID[] NOT NULL, -- array of property IDs to assign
  invitation_token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_invitations ENABLE ROW LEVEL SECURITY;

-- Update profiles table to include property_owner role
ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer', 'property_owner'));

-- Create RLS policies for properties
CREATE POLICY "Property owners can view their properties" ON public.properties
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.property_owners po 
    WHERE po.property_id = properties.id 
    AND po.owner_id = auth.uid()
  )
  OR get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Admins can manage all properties" ON public.properties
FOR ALL USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

CREATE POLICY "Property owners can update their properties" ON public.properties
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.property_owners po 
    WHERE po.property_id = properties.id 
    AND po.owner_id = auth.uid()
  )
);

-- Create RLS policies for property_owners
CREATE POLICY "Users can view their property ownership" ON public.property_owners
FOR SELECT USING (
  owner_id = auth.uid() 
  OR get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Admins can manage property ownership" ON public.property_owners
FOR ALL USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Create RLS policies for tenants
CREATE POLICY "Property owners can view their tenants" ON public.tenants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.property_owners po 
    WHERE po.property_id = tenants.property_id 
    AND po.owner_id = auth.uid()
  )
  OR get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Property owners can manage their tenants" ON public.tenants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.property_owners po 
    WHERE po.property_id = tenants.property_id 
    AND po.owner_id = auth.uid()
  )
  OR get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

-- Create RLS policies for financial_records
CREATE POLICY "Property owners can view their financial records" ON public.financial_records
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.property_owners po 
    WHERE po.property_id = financial_records.property_id 
    AND po.owner_id = auth.uid()
  )
  OR get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Property owners can create financial records" ON public.financial_records
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_owners po 
    WHERE po.property_id = financial_records.property_id 
    AND po.owner_id = auth.uid()
  )
  OR get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Admins can manage all financial records" ON public.financial_records
FOR ALL USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Create RLS policies for property_documents
CREATE POLICY "Property owners can view their documents" ON public.property_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.property_owners po 
    WHERE po.property_id = property_documents.property_id 
    AND po.owner_id = auth.uid()
  )
  OR get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Property owners can upload documents" ON public.property_documents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_owners po 
    WHERE po.property_id = property_documents.property_id 
    AND po.owner_id = auth.uid()
  )
  OR get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Admins can manage all documents" ON public.property_documents
FOR ALL USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Create RLS policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications
FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON public.notifications
FOR ALL USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Create RLS policies for property_invitations
CREATE POLICY "Admins can manage invitations" ON public.property_invitations
FOR ALL USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_property_owners_owner_id ON public.property_owners(owner_id);
CREATE INDEX idx_property_owners_property_id ON public.property_owners(property_id);
CREATE INDEX idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX idx_tenants_is_active ON public.tenants(is_active);
CREATE INDEX idx_financial_records_property_id ON public.financial_records(property_id);
CREATE INDEX idx_financial_records_date ON public.financial_records(transaction_date);
CREATE INDEX idx_financial_records_type ON public.financial_records(type);
CREATE INDEX idx_property_documents_property_id ON public.property_documents(property_id);
CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id, is_read);
CREATE INDEX idx_property_invitations_token ON public.property_invitations(invitation_token);
CREATE INDEX idx_property_invitations_email ON public.property_invitations(email);

-- Insert property_owner permissions
INSERT INTO public.permissions (role, resource, action) VALUES
('property_owner', 'properties', 'read'),
('property_owner', 'properties', 'update'),
('property_owner', 'tenants', 'read'),
('property_owner', 'tenants', 'create'),
('property_owner', 'tenants', 'update'),
('property_owner', 'financial_records', 'read'),
('property_owner', 'financial_records', 'create'),
('property_owner', 'property_documents', 'read'),
('property_owner', 'property_documents', 'create'),
('property_owner', 'notifications', 'read')
ON CONFLICT (role, resource, action) DO NOTHING;