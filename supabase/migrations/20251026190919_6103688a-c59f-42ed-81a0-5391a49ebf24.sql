-- Drop the existing constraint
ALTER TABLE price_offer_blocks 
DROP CONSTRAINT IF EXISTS price_offer_blocks_block_type_check;

-- Add the new constraint with price_quote included
ALTER TABLE price_offer_blocks 
ADD CONSTRAINT price_offer_blocks_block_type_check 
CHECK (block_type IN (
  'header',
  'text', 
  'table',
  'image',
  'price_card',
  'divider',
  'price_quote',
  'map',
  'video'
));