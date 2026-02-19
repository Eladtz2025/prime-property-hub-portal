
-- Drop existing UPDATE and DELETE policies on development_ideas
DROP POLICY IF EXISTS "Users can update their own ideas" ON public.development_ideas;
DROP POLICY IF EXISTS "Users can delete their own ideas" ON public.development_ideas;
DROP POLICY IF EXISTS "Authenticated users can update ideas" ON public.development_ideas;
DROP POLICY IF EXISTS "Authenticated users can delete ideas" ON public.development_ideas;

-- Create new UPDATE policy allowing creator OR admin/manager roles
CREATE POLICY "Users can update ideas" ON public.development_ideas
FOR UPDATE TO authenticated
USING (
  (auth.uid() = created_by) OR 
  (get_current_user_role() = ANY (ARRAY['admin', 'super_admin', 'manager']))
);

-- Create new DELETE policy allowing creator OR admin/manager roles
CREATE POLICY "Users can delete ideas" ON public.development_ideas
FOR DELETE TO authenticated
USING (
  (auth.uid() = created_by) OR 
  (get_current_user_role() = ANY (ARRAY['admin', 'super_admin', 'manager']))
);
