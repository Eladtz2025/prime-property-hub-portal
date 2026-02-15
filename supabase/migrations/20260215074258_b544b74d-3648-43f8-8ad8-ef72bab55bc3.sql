-- Drop the old 2-param version (search_path = 'public' only)
DROP FUNCTION IF EXISTS public.update_cron_schedule(text, text);

-- Recreate the single unified version with optional command parameter
CREATE OR REPLACE FUNCTION public.update_cron_schedule(
  p_job_name text, 
  p_new_schedule text, 
  p_new_command text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'cron', 'public'
AS $function$
  UPDATE cron.job 
  SET schedule = p_new_schedule,
      command = COALESCE(p_new_command, command)
  WHERE jobname = p_job_name;
$function$;