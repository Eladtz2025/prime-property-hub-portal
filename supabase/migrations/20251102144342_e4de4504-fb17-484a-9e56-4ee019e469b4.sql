-- Fix Critical Role Storage Vulnerability
-- Step 1: Update get_current_user_role() to read from user_roles table instead of profiles

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  ORDER BY CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'property_owner' THEN 4
    WHEN 'viewer' THEN 5
  END
  LIMIT 1;
$$;

-- Step 2: Drop and recreate "Users can update own profile" policy with role protection
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent users from changing their role field
  role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid())
);

-- Step 3: Update handle_new_user() trigger to not set role in profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role public.app_role;
BEGIN
    -- Get role from metadata, default to viewer
    user_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::public.app_role,
        'viewer'::public.app_role
    );
    
    -- Insert into profiles (without setting role column)
    INSERT INTO public.profiles (id, email, full_name, is_approved)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        CASE 
            WHEN user_role IN ('admin', 'super_admin') THEN true
            ELSE false
        END
    );
    
    -- Insert into user_roles (authoritative source for roles)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    RETURN NEW;
END;
$$;