-- Add Hebrew translation column to pitch_deck_slides
ALTER TABLE pitch_deck_slides 
ADD COLUMN IF NOT EXISTS slide_data_he jsonb;