-- Create insights table
CREATE TABLE public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('article', 'guide')),
  title_he text,
  title_en text,
  summary_he text,
  summary_en text,
  content_he text,
  content_en text,
  image_url text,
  category text,
  is_published boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Public read for published items
CREATE POLICY "Public can read published insights"
  ON public.insights FOR SELECT
  USING (is_published = true);

-- Admin/manager write access
CREATE POLICY "Admins can manage insights"
  ON public.insights FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Updated_at trigger
CREATE TRIGGER update_insights_updated_at
  BEFORE UPDATE ON public.insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();