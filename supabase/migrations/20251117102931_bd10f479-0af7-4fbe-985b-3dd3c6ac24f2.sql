-- Drop existing foreign keys and recreate with CASCADE DELETE

-- 1. property_images
ALTER TABLE property_images 
DROP CONSTRAINT IF EXISTS property_images_property_id_fkey;

ALTER TABLE property_images 
ADD CONSTRAINT property_images_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- 2. tenants
ALTER TABLE tenants 
DROP CONSTRAINT IF EXISTS tenants_property_id_fkey;

ALTER TABLE tenants 
ADD CONSTRAINT tenants_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- 3. financial_records
ALTER TABLE financial_records 
DROP CONSTRAINT IF EXISTS financial_records_property_id_fkey;

ALTER TABLE financial_records 
ADD CONSTRAINT financial_records_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- 4. rent_payments
ALTER TABLE rent_payments 
DROP CONSTRAINT IF EXISTS rent_payments_property_id_fkey;

ALTER TABLE rent_payments 
ADD CONSTRAINT rent_payments_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- 5. property_documents
ALTER TABLE property_documents 
DROP CONSTRAINT IF EXISTS property_documents_property_id_fkey;

ALTER TABLE property_documents 
ADD CONSTRAINT property_documents_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- 6. tenant_communications
ALTER TABLE tenant_communications 
DROP CONSTRAINT IF EXISTS tenant_communications_property_id_fkey;

ALTER TABLE tenant_communications 
ADD CONSTRAINT tenant_communications_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- 7. property_owners
ALTER TABLE property_owners 
DROP CONSTRAINT IF EXISTS property_owners_property_id_fkey;

ALTER TABLE property_owners 
ADD CONSTRAINT property_owners_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- 8. whatsapp_messages - SET NULL instead of CASCADE (to keep message history)
ALTER TABLE whatsapp_messages 
DROP CONSTRAINT IF EXISTS whatsapp_messages_property_id_fkey;

ALTER TABLE whatsapp_messages 
ADD CONSTRAINT whatsapp_messages_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;