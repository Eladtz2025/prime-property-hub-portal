-- Create site_issues table for bugs/issues tracking
CREATE TABLE public.site_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  reported_by TEXT DEFAULT 'טלי',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_issues ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can view site issues"
  ON public.site_issues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert site issues"
  ON public.site_issues FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update site issues"
  ON public.site_issues FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete site issues"
  ON public.site_issues FOR DELETE
  TO authenticated
  USING (true);