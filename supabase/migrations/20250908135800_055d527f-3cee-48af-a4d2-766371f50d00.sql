-- Update the role check constraint to include property_owner
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer', 'property_owner'));

-- Update the permissions table role constraint
ALTER TABLE public.permissions 
DROP CONSTRAINT IF EXISTS permissions_role_check;

ALTER TABLE public.permissions 
ADD CONSTRAINT permissions_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer', 'property_owner'));

-- Add default permissions for property_owner role
INSERT INTO public.permissions (role, resource, action) VALUES
('property_owner', 'properties', 'read'),
('property_owner', 'properties', 'update'),
('property_owner', 'tenants', 'read'),
('property_owner', 'tenants', 'create'),
('property_owner', 'tenants', 'update'),
('property_owner', 'tenants', 'delete'),
('property_owner', 'financial_records', 'read'),
('property_owner', 'financial_records', 'create'),
('property_owner', 'financial_records', 'update'),
('property_owner', 'rent_payments', 'read'),
('property_owner', 'rent_payments', 'create'),
('property_owner', 'rent_payments', 'update'),
('property_owner', 'documents', 'read'),
('property_owner', 'documents', 'create'),
('property_owner', 'communications', 'read'),
('property_owner', 'communications', 'create'),
('property_owner', 'communications', 'update')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Create a function to handle property invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_property_invitation(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitation_record property_invitations%ROWTYPE;
    property_id_item UUID;
    result JSONB;
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
    
    -- Update user role to property_owner if they're not already admin/super_admin
    UPDATE profiles 
    SET role = 'property_owner', is_approved = true
    WHERE id = auth.uid() 
    AND role NOT IN ('admin', 'super_admin');
    
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

-- Add unique constraint to property_owners to prevent duplicate assignments
ALTER TABLE public.property_owners 
ADD CONSTRAINT property_owners_unique_assignment 
UNIQUE (property_id, owner_id);

-- Update the profiles trigger to handle property_owner role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, is_approved)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' IN ('admin', 'super_admin') THEN true
            ELSE false
        END
    );
    RETURN NEW;
END;
$$;