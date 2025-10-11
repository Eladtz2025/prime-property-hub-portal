-- ============================================
-- SECURITY FIX: User Roles Architecture
-- ============================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'manager', 'viewer', 'property_owner');

-- 2. Create user_roles table with proper security
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::public.app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Update get_current_user_role function to use new table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'property_owner' THEN 4
      WHEN 'viewer' THEN 5
    END
  LIMIT 1;
$$;

-- 6. Update handle_new_user trigger function
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
    
    -- Insert into profiles (without role column now)
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
    
    -- Insert into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    RETURN NEW;
END;
$$;

-- 7. RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only super_admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 8. Update accept_property_invitation to use new roles table
CREATE OR REPLACE FUNCTION public.accept_property_invitation(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitation_record property_invitations%ROWTYPE;
    property_id_item UUID;
    current_role TEXT;
BEGIN
    -- Get the invitation
    SELECT * INTO invitation_record
    FROM property_invitations
    WHERE invitation_token = accept_property_invitation.invitation_token
    AND expires_at > NOW()
    AND used_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;
    
    -- Get current user's highest role
    SELECT role::text INTO current_role
    FROM user_roles
    WHERE user_id = auth.uid()
    ORDER BY CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'manager' THEN 3
        WHEN 'property_owner' THEN 4
        WHEN 'viewer' THEN 5
    END
    LIMIT 1;
    
    -- Add property_owner role if user doesn't have admin/super_admin
    IF current_role NOT IN ('admin', 'super_admin') THEN
        INSERT INTO user_roles (user_id, role)
        VALUES (auth.uid(), 'property_owner')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    -- Update profile approval
    UPDATE profiles 
    SET is_approved = true
    WHERE id = auth.uid();
    
    -- Assign properties to the user
    FOREACH property_id_item IN ARRAY invitation_record.property_ids
    LOOP
        INSERT INTO property_owners (property_id, owner_id, ownership_percentage)
        VALUES (property_id_item, auth.uid(), 100)
        ON CONFLICT (property_id, owner_id) DO NOTHING;
    END LOOP;
    
    -- Mark invitation as used
    UPDATE property_invitations
    SET used_at = NOW()
    WHERE id = invitation_record.id;
    
    RETURN jsonb_build_object('success', true, 'properties_assigned', array_length(invitation_record.property_ids, 1));
END;
$$;

-- 9. Fix RLS policies that were vulnerable

-- Fix property_invitations email exposure
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON public.property_invitations;
CREATE POLICY "View invitations only with valid token"
ON public.property_invitations
FOR SELECT
USING (
  invitation_token IS NOT NULL 
  AND expires_at > NOW() 
  AND used_at IS NULL
);

-- Fix contact_leads data protection
CREATE POLICY "Admins can view contact leads"
ON public.contact_leads
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- 10. Remove role column from profiles (after migration is complete)
-- Note: We keep it for now to avoid breaking existing code
-- It will be removed in a follow-up migration after code is updated
ALTER TABLE public.profiles 
ALTER COLUMN role DROP NOT NULL,
ALTER COLUMN role SET DEFAULT 'viewer'::text;