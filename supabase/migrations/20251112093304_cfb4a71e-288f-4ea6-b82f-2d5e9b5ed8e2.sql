-- Step 1: Drop storage policies that depend on profiles.role
DROP POLICY IF EXISTS "Admins can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete property images" ON storage.objects;

-- Step 2: Drop the profile policy that depends on role column
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Step 3: Now we can drop profiles.role
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Step 4: Recreate the profile update policy without role check
CREATE POLICY "Users can update own profile" 
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 5: Recreate storage policies using get_current_user_role()
CREATE POLICY "Admins can upload property images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Admins can update property images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

CREATE POLICY "Admins can delete property images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

-- Step 6: Create view that combines profiles with user_roles
CREATE OR REPLACE VIEW user_profiles_with_roles AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.is_approved,
  p.created_at,
  p.updated_at,
  p.last_login,
  COALESCE(
    (
      SELECT ur.role::text
      FROM user_roles ur
      WHERE ur.user_id = p.id
      ORDER BY CASE ur.role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'manager' THEN 3
        WHEN 'property_owner' THEN 4
        WHEN 'viewer' THEN 5
      END
      LIMIT 1
    ),
    'viewer'
  ) as role
FROM profiles p;

-- Step 7: Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_role public.app_role;
    v_invitation user_invitations%ROWTYPE;
BEGIN
    -- Check for active invitation
    SELECT * INTO v_invitation
    FROM user_invitations
    WHERE email = NEW.email
      AND expires_at > now()
      AND used_at IS NULL
    LIMIT 1;
    
    -- If invitation exists, use that role and approve
    IF v_invitation.id IS NOT NULL THEN
        user_role := v_invitation.role::public.app_role;
        
        -- Insert into profiles WITHOUT role
        INSERT INTO public.profiles (id, email, full_name, is_approved)
        VALUES (
            NEW.id, 
            NEW.email, 
            NEW.raw_user_meta_data->>'full_name',
            true
        );
        
        -- Insert into user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, user_role);
        
        -- Mark invitation as used
        UPDATE user_invitations
        SET used_at = now()
        WHERE id = v_invitation.id;
    ELSE
        -- Regular signup
        user_role := COALESCE(
            (NEW.raw_user_meta_data->>'role')::public.app_role,
            'viewer'::public.app_role
        );
        
        -- Insert into profiles WITHOUT role
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
    END IF;
    
    RETURN NEW;
END;
$function$;