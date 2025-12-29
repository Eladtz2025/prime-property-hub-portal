-- Create table for all legal forms (memorandum, exclusivity, broker sharing, contracts, etc.)
CREATE TABLE public.legal_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type TEXT NOT NULL, -- 'memorandum', 'exclusivity', 'broker_sharing', 'short_term_contract', 'standard_contract', 'rental_addendum'
  language TEXT NOT NULL DEFAULT 'he',
  
  -- Client/Tenant details
  client_name TEXT,
  client_id_number TEXT,
  client_phone TEXT,
  client_email TEXT,
  client_address TEXT,
  
  -- Property details
  property_address TEXT,
  property_city TEXT,
  property_floor TEXT,
  property_rooms TEXT,
  property_size TEXT,
  
  -- Financial details
  rental_price TEXT,
  deposit_amount TEXT,
  payment_method TEXT,
  guarantees TEXT,
  
  -- Dates
  entry_date DATE,
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Additional fields stored as JSONB for flexibility
  form_data JSONB DEFAULT '{}'::jsonb,
  
  -- Signatures
  client_signature TEXT,
  agent_signature TEXT,
  second_party_signature TEXT, -- For forms with 2 signers (broker sharing)
  
  -- Second party details (for broker sharing)
  second_party_name TEXT,
  second_party_id TEXT,
  second_party_phone TEXT,
  
  -- Agent details
  agent_name TEXT,
  agent_id_number TEXT,
  agent_license TEXT,
  agent_phone TEXT,
  
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'pending', 'signed', 'cancelled'
  notes TEXT,
  
  -- Ownership and timestamps
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_at TIMESTAMPTZ,
  
  -- PDF storage
  pdf_url TEXT
);

-- Create table for remote signing tokens
CREATE TABLE public.legal_form_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  form_type TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'he',
  
  -- Pre-filled form data
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'signed', 'expired', 'cancelled'
  
  -- Ownership and timestamps
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  signed_at TIMESTAMPTZ,
  
  -- After signing, link to the created form
  legal_form_id UUID REFERENCES public.legal_forms(id)
);

-- Enable RLS
ALTER TABLE public.legal_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_form_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for legal_forms
CREATE POLICY "Admins can manage all legal forms"
ON public.legal_forms
FOR ALL
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'))
WITH CHECK (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

CREATE POLICY "Users can view their own legal forms"
ON public.legal_forms
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Anyone can create legal forms"
ON public.legal_forms
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete legal forms"
ON public.legal_forms
FOR DELETE
USING (get_current_user_role() IN ('admin', 'super_admin'));

-- Policies for legal_form_tokens
CREATE POLICY "Admins can manage all tokens"
ON public.legal_form_tokens
FOR ALL
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'))
WITH CHECK (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

CREATE POLICY "Anyone can view pending tokens by token value"
ON public.legal_form_tokens
FOR SELECT
USING (status = 'pending' AND expires_at > now());

CREATE POLICY "Anyone can update pending tokens to signed"
ON public.legal_form_tokens
FOR UPDATE
USING (status = 'pending' AND expires_at > now())
WITH CHECK (status IN ('pending', 'signed'));

-- Create updated_at trigger
CREATE TRIGGER update_legal_forms_updated_at
BEFORE UPDATE ON public.legal_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_legal_forms_form_type ON public.legal_forms(form_type);
CREATE INDEX idx_legal_forms_status ON public.legal_forms(status);
CREATE INDEX idx_legal_forms_created_by ON public.legal_forms(created_by);
CREATE INDEX idx_legal_forms_created_at ON public.legal_forms(created_at DESC);
CREATE INDEX idx_legal_form_tokens_token ON public.legal_form_tokens(token);
CREATE INDEX idx_legal_form_tokens_status ON public.legal_form_tokens(status);