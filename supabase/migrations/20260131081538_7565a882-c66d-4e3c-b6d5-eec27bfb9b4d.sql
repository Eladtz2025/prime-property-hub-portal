-- STEP 1: First, let's reset ALL scouted_properties is_private to NULL
-- This ensures we can re-populate correctly based on manual verification

-- For now, we'll mark all as needing re-verification by setting to null
-- Then future scans will populate correctly

-- But since we can't easily re-scrape everything, let's take a different approach:
-- The parser was broken - we don't know which historical data is correct
-- Let's set all Yad2 to NULL and only the new scans will be accurate

UPDATE public.scouted_properties
SET is_private = NULL
WHERE source = 'yad2';