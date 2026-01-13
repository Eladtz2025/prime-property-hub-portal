-- First drop the existing check constraint
ALTER TABLE scouted_properties 
DROP CONSTRAINT IF EXISTS scouted_properties_status_check;

-- Update status from 'notified' to 'matched' BEFORE adding new constraint
UPDATE scouted_properties 
SET status = 'matched' 
WHERE status = 'notified';

-- Add new check constraint with 'matched' instead of 'notified'
ALTER TABLE scouted_properties 
ADD CONSTRAINT scouted_properties_status_check 
CHECK (status IN ('new', 'matched', 'imported', 'archived', 'inactive'));

-- Add is_active column for tracking if property is still available on source website
ALTER TABLE scouted_properties 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;