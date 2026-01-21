-- Add technical parameter columns to scout_configs
ALTER TABLE scout_configs ADD COLUMN IF NOT EXISTS max_pages integer;
ALTER TABLE scout_configs ADD COLUMN IF NOT EXISTS page_delay_seconds integer;
ALTER TABLE scout_configs ADD COLUMN IF NOT EXISTS wait_for_ms integer;
ALTER TABLE scout_configs ADD COLUMN IF NOT EXISTS schedule_times text[];

-- Add comments for documentation
COMMENT ON COLUMN scout_configs.max_pages IS 'Number of pages to scrape (null = use default from scout_settings)';
COMMENT ON COLUMN scout_configs.page_delay_seconds IS 'Delay between pages in seconds (null = use source default)';
COMMENT ON COLUMN scout_configs.wait_for_ms IS 'Wait time for page load in milliseconds (null = use source default)';
COMMENT ON COLUMN scout_configs.schedule_times IS 'Array of schedule times like ["08:30", "16:30"] (null = use source default)';