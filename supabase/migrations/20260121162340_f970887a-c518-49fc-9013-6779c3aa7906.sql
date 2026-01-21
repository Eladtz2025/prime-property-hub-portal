-- Add page_stats column to scout_runs table for detailed per-page statistics
ALTER TABLE scout_runs ADD COLUMN IF NOT EXISTS page_stats JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN scout_runs.page_stats IS 'Per-page scraping statistics: [{page, url, found, new, duration_ms}]';