-- Stop the running scan
UPDATE scout_runs 
SET status = 'completed', completed_at = NOW() 
WHERE id = '33120d94-4979-4ce5-8871-4adcd5ca71b1';

-- Delete ALL corrupted homeless prices for fresh re-scraping
DELETE FROM scouted_properties 
WHERE source = 'homeless' 
AND (
  -- Years mistaken for prices (2020-2030)
  (price >= 2020 AND price <= 2030)
  -- Rentals with impossible prices
  OR (property_type = 'rent' AND price > 25000)
  -- Rentals with no price
  OR (property_type = 'rent' AND price IS NULL)
  -- Very low prices that are suspicious
  OR (property_type = 'rent' AND price < 500)
);