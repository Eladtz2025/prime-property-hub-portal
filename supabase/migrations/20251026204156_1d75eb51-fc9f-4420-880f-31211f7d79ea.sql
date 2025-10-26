-- Add slug column to price_offers table
ALTER TABLE price_offers
ADD COLUMN slug text UNIQUE;

-- Add index for better performance
CREATE INDEX idx_price_offers_slug ON price_offers(slug);

-- Add comment for documentation
COMMENT ON COLUMN price_offers.slug IS 'Custom URL-friendly identifier for the price offer (optional, if empty will use token)';