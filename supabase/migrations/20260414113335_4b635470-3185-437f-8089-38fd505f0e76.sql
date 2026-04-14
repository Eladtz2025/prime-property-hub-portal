
-- Add publish_times array column
ALTER TABLE public.auto_publish_queues 
ADD COLUMN publish_times text[] DEFAULT '{}';

-- Copy existing publish_time into the new array
UPDATE public.auto_publish_queues 
SET publish_times = ARRAY[publish_time]
WHERE publish_time IS NOT NULL AND publish_time != '';
