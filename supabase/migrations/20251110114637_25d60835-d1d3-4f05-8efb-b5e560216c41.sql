-- Create user_invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer', 'property_owner')),
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  invitation_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage invitations"
ON user_invitations FOR ALL
USING (get_current_user_role() = ANY (ARRAY['admin', 'super_admin']));

CREATE POLICY "Anyone can view with valid token"
ON user_invitations FOR SELECT
USING (
  invitation_token IS NOT NULL 
  AND expires_at > now() 
  AND used_at IS NULL
);

-- Update handle_new_user trigger to check for invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
        
        -- Insert into profiles with auto-approval
        INSERT INTO public.profiles (id, email, full_name, is_approved)
        VALUES (
            NEW.id, 
            NEW.email, 
            NEW.raw_user_meta_data->>'full_name',
            true  -- Auto-approve invited users
        );
        
        -- Insert into user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, user_role);
        
        -- Mark invitation as used
        UPDATE user_invitations
        SET used_at = now()
        WHERE id = v_invitation.id;
    ELSE
        -- Regular signup - get role from metadata or default to viewer
        user_role := COALESCE(
            (NEW.raw_user_meta_data->>'role')::public.app_role,
            'viewer'::public.app_role
        );
        
        -- Insert into profiles without approval
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