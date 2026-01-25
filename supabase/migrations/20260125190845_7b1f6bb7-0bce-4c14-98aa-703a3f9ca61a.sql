-- Add start_page column to scout_configs
-- Allows skipping page 1 which often triggers more CAPTCHA blocks
ALTER TABLE scout_configs 
ADD COLUMN IF NOT EXISTS start_page INTEGER DEFAULT 1;

-- Set Madlan configs to start from page 2 by default
UPDATE scout_configs 
SET start_page = 2 
WHERE source = 'madlan';

-- Add comment for documentation
COMMENT ON COLUMN scout_configs.start_page IS 'First page to scrape (default 1). Set to 2 for Madlan to avoid CAPTCHA on landing page.';