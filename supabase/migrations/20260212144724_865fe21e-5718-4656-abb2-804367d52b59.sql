
-- RPC to update cron job schedules
CREATE OR REPLACE FUNCTION public.update_cron_schedule(p_job_name TEXT, p_new_schedule TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE cron.job SET schedule = p_new_schedule WHERE jobname = p_job_name;
$$;

-- Add missing schedule_times settings
INSERT INTO public.scout_settings (category, setting_key, setting_value, description)
VALUES 
  ('duplicates', 'schedule_times', '["00:00"]', 'שעות ריצת ניקוי כפילויות (שעון ישראל)'),
  ('availability', 'schedule_times', '["05:00"]', 'שעות ריצת בדיקת זמינות (שעון ישראל)')
ON CONFLICT DO NOTHING;
