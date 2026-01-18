-- Create development ideas table for tracking feature ideas
CREATE TABLE public.development_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.development_ideas ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view ideas
CREATE POLICY "Authenticated users can view ideas"
  ON public.development_ideas
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert ideas
CREATE POLICY "Authenticated users can insert ideas"
  ON public.development_ideas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can update/delete their ideas
CREATE POLICY "Users can update their own ideas"
  ON public.development_ideas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own ideas"
  ON public.development_ideas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create index for performance
CREATE INDEX idx_development_ideas_created_at ON public.development_ideas(created_at DESC);
CREATE INDEX idx_development_ideas_is_completed ON public.development_ideas(is_completed);