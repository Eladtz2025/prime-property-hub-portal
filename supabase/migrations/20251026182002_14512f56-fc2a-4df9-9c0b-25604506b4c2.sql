-- Create price_offer_templates table
CREATE TABLE IF NOT EXISTS public.price_offer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.price_offer_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage all templates
CREATE POLICY "Admins can manage all templates"
ON public.price_offer_templates
FOR ALL
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- Users can view public templates and their own templates
CREATE POLICY "Users can view accessible templates"
ON public.price_offer_templates
FOR SELECT
USING (
  is_public = true 
  OR created_by = auth.uid() 
  OR get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

-- Add trigger for updated_at
CREATE TRIGGER update_price_offer_templates_updated_at
BEFORE UPDATE ON public.price_offer_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();