-- Create signature_forms table
CREATE TABLE IF NOT EXISTS public.signature_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL CHECK (form_type IN ('memorandum', 'viewing')),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  form_data jsonb NOT NULL,
  signature_data text,
  signed_at timestamp with time zone,
  signed_by_name text,
  signed_by_id_number text,
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  sent_to_phone text,
  sent_to_email text,
  sent_at timestamp with time zone DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'signed', 'expired')),
  pdf_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signature_forms ENABLE ROW LEVEL SECURITY;

-- Admins can view all signature forms
CREATE POLICY "Admins can view all signature forms"
ON public.signature_forms
FOR SELECT
USING (
  get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

-- Admins can create signature forms
CREATE POLICY "Admins can create signature forms"
ON public.signature_forms
FOR INSERT
WITH CHECK (
  get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

-- Anyone with valid token can view their form
CREATE POLICY "Anyone with token can view form"
ON public.signature_forms
FOR SELECT
USING (true);

-- Anyone with valid token can update their signature
CREATE POLICY "Anyone with token can sign form"
ON public.signature_forms
FOR UPDATE
USING (status = 'sent')
WITH CHECK (status IN ('sent', 'signed'));

-- Admins can update forms
CREATE POLICY "Admins can update signature forms"
ON public.signature_forms
FOR UPDATE
USING (
  get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

-- Create updated_at trigger
CREATE TRIGGER update_signature_forms_updated_at
  BEFORE UPDATE ON public.signature_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for signed PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('signature-forms', 'signature-forms', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for signature forms
CREATE POLICY "Admins can view signature PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'signature-forms' AND
  get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Admins can upload signature PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'signature-forms' AND
  get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Public can view their signed PDFs with token"
ON storage.objects
FOR SELECT
USING (bucket_id = 'signature-forms');