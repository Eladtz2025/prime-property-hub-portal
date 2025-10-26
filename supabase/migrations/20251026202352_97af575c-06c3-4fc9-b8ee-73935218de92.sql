-- Drop the old constraint first
ALTER TABLE price_offer_blocks 
DROP CONSTRAINT IF EXISTS price_offer_blocks_block_type_check;

-- Update any existing rows with 'image' to 'images'
UPDATE price_offer_blocks 
SET block_type = 'images' 
WHERE block_type = 'image';

-- Add new constraint with 'images' instead of 'image'
ALTER TABLE price_offer_blocks 
ADD CONSTRAINT price_offer_blocks_block_type_check 
CHECK (block_type = ANY (ARRAY[
  'header'::text, 
  'text'::text, 
  'table'::text, 
  'images'::text,  -- Changed from 'image' to 'images'
  'price_card'::text, 
  'divider'::text, 
  'price_quote'::text, 
  'map'::text, 
  'video'::text
]));