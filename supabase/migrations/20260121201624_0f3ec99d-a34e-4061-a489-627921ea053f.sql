-- Update schedule_times for configs that are missing them

-- Homeless Rent: runs at :00 (on the hour)
UPDATE scout_configs 
SET schedule_times = ARRAY['08:00', '16:00', '22:00']
WHERE id = 'cd672ace-0f8b-47c4-886f-0370e7ec9cb0'
AND (schedule_times IS NULL OR array_length(schedule_times, 1) IS NULL);

-- Madlan Rent: runs at :10 (10 minutes after hour)
UPDATE scout_configs 
SET schedule_times = ARRAY['08:10', '16:10', '22:10']
WHERE id = '06a8a377-5983-480a-921d-0b7f2b072447'
AND (schedule_times IS NULL OR array_length(schedule_times, 1) IS NULL);

-- Madlan Sale: runs at :10 (10 minutes after hour)
UPDATE scout_configs 
SET schedule_times = ARRAY['08:10', '16:10', '22:10']
WHERE id = '4fa306f1-66f1-4e9e-9796-4e99197149e2'
AND (schedule_times IS NULL OR array_length(schedule_times, 1) IS NULL);