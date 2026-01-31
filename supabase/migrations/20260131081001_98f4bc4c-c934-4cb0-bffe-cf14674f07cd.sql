-- Fix inverted is_private flag for all existing scouted properties
-- The bug was that private listings were marked as broker and vice versa
-- Simply flip the boolean value for all records

UPDATE public.scouted_properties
SET is_private = NOT is_private
WHERE is_private IS NOT NULL;