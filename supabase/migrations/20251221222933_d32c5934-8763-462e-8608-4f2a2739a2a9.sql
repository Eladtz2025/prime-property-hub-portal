-- Create exclusive listing forms table
CREATE TABLE public.exclusive_listing_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE DEFAULT gen_random_uuid()::text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'cancelled')),
  
  -- Agent/Broker details
  created_by uuid REFERENCES auth.users(id),
  agent_name text,
  agent_license text,
  agent_phone text,
  agent_id_number text,
  agent_signature text,
  
  -- Language
  language text DEFAULT 'he',
  
  -- Owner details
  owner_name text,
  owner_id_number text,
  owner_address text,
  owner_phone text,
  owner_email text,
  owner_signature text,
  owner_signed_at timestamptz,
  
  -- Property details
  property_address text,
  property_gush_helka text,
  property_size_sqm text,
  property_rooms text,
  property_floor text,
  property_parking boolean DEFAULT false,
  property_storage boolean DEFAULT false,
  property_balcony boolean DEFAULT false,
  property_elevator boolean DEFAULT false,
  
  -- Transaction type
  transaction_type text CHECK (transaction_type IN ('sale', 'rent')),
  asking_price text,
  
  -- Exclusivity period
  start_date date,
  end_date date,
  exclusivity_months integer,
  
  -- Defects disclosure
  defects_questionnaire jsonb DEFAULT '{}',
  defects_details text,
  
  -- Marketing activities
  marketing_activities jsonb DEFAULT '{}',
  marketing_other text,
  
  -- Commission
  commission_percentage text,
  commission_includes_vat boolean DEFAULT false,
  
  -- Confirmations
  confirm_understanding boolean DEFAULT false,
  confirm_accuracy boolean DEFAULT false,
  confirm_defects boolean DEFAULT false,
  
  -- Full form data backup
  form_data jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.exclusive_listing_forms ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (brokers/agents)
CREATE POLICY "Authenticated users can create exclusive listing forms"
ON public.exclusive_listing_forms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can view their own exclusive listing forms"
ON public.exclusive_listing_forms
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update their own exclusive listing forms"
ON public.exclusive_listing_forms
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Policy for anonymous users (signing via token)
CREATE POLICY "Anyone can view pending forms by token"
ON public.exclusive_listing_forms
FOR SELECT
TO anon
USING (status = 'pending' AND expires_at > now());

CREATE POLICY "Anyone can sign pending forms"
ON public.exclusive_listing_forms
FOR UPDATE
TO anon
USING (status = 'pending' AND expires_at > now())
WITH CHECK (status = 'pending' AND expires_at > now());

-- Create updated_at trigger
CREATE TRIGGER update_exclusive_listing_forms_updated_at
  BEFORE UPDATE ON public.exclusive_listing_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();