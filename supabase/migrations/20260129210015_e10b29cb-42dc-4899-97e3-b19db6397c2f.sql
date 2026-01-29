-- Delete ALL corrupted homeless prices for re-scraping
-- Any rental above 20,000 is suspicious (room number concatenated)
-- Any rental below 500 is likely a year or ad ID
DELETE FROM scouted_properties 
WHERE source = 'homeless' 
AND (
  -- Rentals with impossible prices
  (property_type = 'rent' AND (price > 20000 OR price < 500))
  -- Sales with impossible prices  
  OR (property_type = 'sale' AND (price > 30000000 OR price < 50000))
);