
-- Update the RPC to support updating command too
CREATE OR REPLACE FUNCTION public.update_cron_schedule(p_job_name text, p_new_schedule text, p_new_command text DEFAULT NULL)
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
