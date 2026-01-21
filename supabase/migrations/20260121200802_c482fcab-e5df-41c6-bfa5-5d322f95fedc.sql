
-- Update missing scout_configs with proper values
-- Homeless Rent: 8 pages, 2s delay (same as Homeless Sale)
UPDATE scout_configs 
SET max_pages = 8, page_delay_seconds = 2 
WHERE id = 'cd672ace-0f8b-47c4-886f-0370e7ec9cb0';

-- Madlan Rent: 4 pages, 8s delay (Madlan is more sensitive to bots)
UPDATE scout_configs 
SET max_pages = 4, page_delay_seconds = 8 
WHERE id = '06a8a377-5983-480a-921d-0b7f2b072447';

-- Madlan Sale: 4 pages, 8s delay
UPDATE scout_configs 
SET max_pages = 4, page_delay_seconds = 8 
WHERE id = '4fa306f1-66f1-4e9e-9796-4e99197149e2';
