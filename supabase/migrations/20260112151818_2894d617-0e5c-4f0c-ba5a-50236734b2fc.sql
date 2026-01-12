-- Create scouted_properties table for storing scraped listings
CREATE TABLE public.scouted_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('yad2', 'madlan', 'other')),
  source_url TEXT NOT NULL,
  source_id TEXT, -- ID from the source website to prevent duplicates
  title TEXT,
  city TEXT,
  neighborhood TEXT,
  address TEXT,
  price INTEGER,
  rooms NUMERIC(3,1),
  size INTEGER, -- sqm
  floor INTEGER,
  property_type TEXT CHECK (property_type IN ('rent', 'sale')),
  description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '{}'::jsonb, -- parking, elevator, balcony, etc.
  raw_data JSONB, -- full scraped data for reference
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'notified', 'archived', 'imported')),
  matched_leads JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source, source_id) -- prevent duplicates from same source
);

-- Create scout_configs table for search configurations
CREATE TABLE public.scout_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('yad2', 'madlan', 'both')),
  property_type TEXT NOT NULL CHECK (property_type IN ('rent', 'sale', 'both')),
  cities TEXT[] DEFAULT '{}',
  neighborhoods TEXT[] DEFAULT '{}',
  min_price INTEGER,
  max_price INTEGER,
  min_rooms NUMERIC(3,1),
  max_rooms NUMERIC(3,1),
  min_size INTEGER,
  max_size INTEGER,
  search_url TEXT, -- custom URL to scrape
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_run_status TEXT,
  last_run_results JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scout_runs table for logging each run
CREATE TABLE public.scout_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES public.scout_configs(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  properties_found INTEGER DEFAULT 0,
  new_properties INTEGER DEFAULT 0,
  leads_matched INTEGER DEFAULT 0,
  whatsapp_sent INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.scouted_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies for scouted_properties (admin/manager access)
CREATE POLICY "Admins can view scouted properties"
  ON public.scouted_properties FOR SELECT
  USING (public.get_current_user_role() IN ('super_admin', 'admin', 'manager'));

CREATE POLICY "Admins can insert scouted properties"
  ON public.scouted_properties FOR INSERT
  WITH CHECK (public.get_current_user_role() IN ('super_admin', 'admin', 'manager'));

CREATE POLICY "Admins can update scouted properties"
  ON public.scouted_properties FOR UPDATE
  USING (public.get_current_user_role() IN ('super_admin', 'admin', 'manager'));

CREATE POLICY "Admins can delete scouted properties"
  ON public.scouted_properties FOR DELETE
  USING (public.get_current_user_role() IN ('super_admin', 'admin'));

-- RLS policies for scout_configs
CREATE POLICY "Admins can view scout configs"
  ON public.scout_configs FOR SELECT
  USING (public.get_current_user_role() IN ('super_admin', 'admin', 'manager'));

CREATE POLICY "Admins can manage scout configs"
  ON public.scout_configs FOR ALL
  USING (public.get_current_user_role() IN ('super_admin', 'admin'));

-- RLS policies for scout_runs
CREATE POLICY "Admins can view scout runs"
  ON public.scout_runs FOR SELECT
  USING (public.get_current_user_role() IN ('super_admin', 'admin', 'manager'));

CREATE POLICY "System can insert scout runs"
  ON public.scout_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update scout runs"
  ON public.scout_runs FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_scouted_properties_status ON public.scouted_properties(status);
CREATE INDEX idx_scouted_properties_source ON public.scouted_properties(source);
CREATE INDEX idx_scouted_properties_city ON public.scouted_properties(city);
CREATE INDEX idx_scouted_properties_first_seen ON public.scouted_properties(first_seen_at DESC);
CREATE INDEX idx_scout_configs_active ON public.scout_configs(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_scouted_properties_updated_at
  BEFORE UPDATE ON public.scouted_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scout_configs_updated_at
  BEFORE UPDATE ON public.scout_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();