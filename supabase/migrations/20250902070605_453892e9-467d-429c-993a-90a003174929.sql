-- Add permission for viewing phone numbers using existing 'read' action
INSERT INTO public.permissions (role, resource, action) VALUES 
('super_admin', 'contacts', 'read');