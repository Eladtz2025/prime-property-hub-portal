-- Add broker-specific fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS broker_license_number TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.broker_license_number IS 'מספר רישיון תיווך';
COMMENT ON COLUMN profiles.id_number IS 'מספר תעודת זהות';
COMMENT ON COLUMN profiles.address IS 'כתובת המתווך';