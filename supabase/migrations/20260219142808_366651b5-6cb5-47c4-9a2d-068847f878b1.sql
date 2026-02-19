
-- Create dashboard_goals table
CREATE TABLE public.dashboard_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_goals ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated users
CREATE POLICY "Authenticated users can read goals"
ON public.dashboard_goals FOR SELECT
TO authenticated
USING (true);

-- Insert: admin/super_admin/manager only
CREATE POLICY "Admins can insert goals"
ON public.dashboard_goals FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Update: admin/super_admin/manager only
CREATE POLICY "Admins can update goals"
ON public.dashboard_goals FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Delete: admin/super_admin/manager only
CREATE POLICY "Admins can delete goals"
ON public.dashboard_goals FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Trigger for updated_at
CREATE TRIGGER update_dashboard_goals_updated_at
BEFORE UPDATE ON public.dashboard_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
