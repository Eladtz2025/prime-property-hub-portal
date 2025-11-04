
-- Drop the old check constraint
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;

-- Add the updated check constraint with new notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'lease_expiry'::text, 
  'rent_due'::text, 
  'maintenance'::text, 
  'document_upload'::text, 
  'system'::text,
  'property_inquiry'::text,
  'consultation_request'::text
]));
