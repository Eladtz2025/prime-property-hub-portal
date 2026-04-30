UPDATE public.feature_flags
SET name = 'process_phone_extraction'
WHERE name = 'phone_extraction_enabled';

-- Ensure flag exists (in case rename target or original missing)
INSERT INTO public.feature_flags (name, is_enabled, description)
SELECT 'process_phone_extraction', false, 'הפעלת תהליך חילוץ טלפונים מ-Homeless'
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'process_phone_extraction');