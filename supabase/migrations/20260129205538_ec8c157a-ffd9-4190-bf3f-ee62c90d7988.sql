-- Delete corrupted homeless prices - they'll be re-scraped with correct values
DELETE FROM scouted_properties 
WHERE source = 'homeless' 
AND (
  -- Prices ending with suspicious patterns (ad ID remnants)
  (price::text ~ '000[0-9]$' OR price::text ~ '00[0-9][0-9]$')
  -- Or rentals with prices above 50k (impossible)
  OR (property_type = 'rent' AND price > 50000)
  -- Or sales above 50M (very rare)
  OR (property_type = 'sale' AND price > 50000000)
)