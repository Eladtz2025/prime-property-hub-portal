-- Delete additional corrupted homeless prices
-- Rentals above 20,000 are almost certainly corrupted (room number prefix added)
DELETE FROM scouted_properties 
WHERE source = 'homeless' 
AND property_type = 'rent' 
AND price > 20000;