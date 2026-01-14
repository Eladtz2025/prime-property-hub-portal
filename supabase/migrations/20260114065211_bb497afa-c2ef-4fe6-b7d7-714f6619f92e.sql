-- Add is_private column to track private vs broker listings
ALTER TABLE scouted_properties 
ADD COLUMN is_private BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN scouted_properties.is_private IS 'true = פרטי, false = תיווך, null = לא ידוע';