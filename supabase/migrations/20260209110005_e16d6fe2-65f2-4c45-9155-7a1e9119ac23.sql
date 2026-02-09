
-- Add tracking_url to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tracking_url text;

-- Project units table
CREATE TABLE public.project_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_identifier text NOT NULL,
  rooms numeric,
  size integer,
  floor integer,
  price integer,
  unit_type text,
  status text NOT NULL DEFAULT 'available',
  raw_text text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  price_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, unit_identifier)
);

-- Project scan logs table
CREATE TABLE public.project_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  units_found integer DEFAULT 0,
  units_added integer DEFAULT 0,
  units_removed integer DEFAULT 0,
  units_changed integer DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_project_units_property_id ON public.project_units(property_id);
CREATE INDEX idx_project_units_status ON public.project_units(status);
CREATE INDEX idx_project_scan_logs_property_id ON public.project_scan_logs(property_id);
CREATE INDEX idx_project_scan_logs_scanned_at ON public.project_scan_logs(scanned_at DESC);

-- Updated_at trigger for project_units
CREATE TRIGGER update_project_units_updated_at
  BEFORE UPDATE ON public.project_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.project_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project units"
  ON public.project_units FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage project units"
  ON public.project_units FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view scan logs"
  ON public.project_scan_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage scan logs"
  ON public.project_scan_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
