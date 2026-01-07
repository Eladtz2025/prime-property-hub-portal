-- Create SEO checks history table
CREATE TABLE public.seo_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  page_name TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  results JSONB NOT NULL DEFAULT '{}',
  ai_analysis JSONB,
  fix_prompt TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.seo_checks ENABLE ROW LEVEL SECURITY;

-- Create policies - admins can manage
CREATE POLICY "Admins can view seo_checks" ON public.seo_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert seo_checks" ON public.seo_checks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete seo_checks" ON public.seo_checks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX idx_seo_checks_url ON public.seo_checks(page_url);
CREATE INDEX idx_seo_checks_date ON public.seo_checks(checked_at DESC);

COMMENT ON TABLE public.seo_checks IS 'SEO check history for tracking improvements over time';