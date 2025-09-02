-- Add permission for viewing phone numbers (only for super_admin)
INSERT INTO public.permissions (role, resource, action) VALUES 
('super_admin', 'contacts', 'view_phone_numbers');