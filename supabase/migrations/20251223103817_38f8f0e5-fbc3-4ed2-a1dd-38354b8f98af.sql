-- Create brokers table
CREATE TABLE public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  office_name TEXT,
  interested_properties UUID[] DEFAULT '{}',
  interested_properties_text TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can view brokers" 
ON public.brokers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert brokers" 
ON public.brokers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update brokers" 
ON public.brokers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete brokers" 
ON public.brokers FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_brokers_updated_at
BEFORE UPDATE ON public.brokers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();