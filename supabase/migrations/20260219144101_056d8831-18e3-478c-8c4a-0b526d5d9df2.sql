
-- Create business_expenses_list table
CREATE TABLE public.business_expenses_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_expenses_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage business expenses"
ON public.business_expenses_list FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create professionals_list table
CREATE TABLE public.professionals_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  profession TEXT NOT NULL,
  phone TEXT,
  area TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.professionals_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage professionals"
ON public.professionals_list FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_business_expenses_updated_at
BEFORE UPDATE ON public.business_expenses_list
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals_list
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
