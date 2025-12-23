-- Make email optional (nullable)
ALTER TABLE contact_leads ALTER COLUMN email DROP NOT NULL;

-- Make phone required (not null) - first update existing nulls
UPDATE contact_leads SET phone = 'unknown' WHERE phone IS NULL;
ALTER TABLE contact_leads ALTER COLUMN phone SET NOT NULL;