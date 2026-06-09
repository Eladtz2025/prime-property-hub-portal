-- Marketing audit P4: DB / RLS hardening.

-- db-6: update_cron_schedule was SECURITY DEFINER and executable by anon/public,
-- letting an unauthenticated REST call rewrite ANY pg_cron job (including the
-- social-scheduler / auto-publish publishing jobs). Add an in-function admin check
-- and remove anon/public EXECUTE. authenticated is retained because the Scout
-- schedule editor (ScheduleTimeEditor.tsx) calls it as a logged-in admin.
create or replace function public.update_cron_schedule(
  p_job_name text, p_new_schedule text, p_new_command text default null
)
returns void
language plpgsql
security definer
set search_path to 'cron', 'public'
as $$
begin
  if not (public.has_role(auth.uid(), 'admin'::public.app_role)
          or public.has_role(auth.uid(), 'super_admin'::public.app_role)) then
    raise exception 'Only admins may update cron schedules';
  end if;
  update cron.job
     set schedule = p_new_schedule,
         command  = coalesce(p_new_command, command)
   where jobname = p_job_name;
end;
$$;

revoke execute on function public.update_cron_schedule(text, text, text) from public, anon;
grant  execute on function public.update_cron_schedule(text, text, text) to authenticated, service_role;

-- db-4: auto_publish_* SELECT was USING(true) for any authenticated user (incl. a
-- 'viewer'), looser than the admin-only social_* tables. Drop the permissive SELECT
-- policies; the existing "Admins can manage ..." FOR ALL policy already grants SELECT
-- to admin/super_admin/manager.
drop policy if exists "Authenticated can view auto_publish_queues" on public.auto_publish_queues;
drop policy if exists "Authenticated can view auto_publish_items"  on public.auto_publish_items;
drop policy if exists "Authenticated can view auto_publish_log"    on public.auto_publish_log;

-- db-4: duplicate service_role policy on auto_publish_log (keep the other one).
drop policy if exists "Service role full access logs" on public.auto_publish_log;

-- db-2: defense-in-depth. anon never legitimately touches the marketing tables
-- (RLS already blocks it); remove the table-level grant so a future RLS slip can't
-- expose Facebook tokens / post data. authenticated + service_role keep their grants.
revoke all on public.social_accounts            from anon;
revoke all on public.social_posts               from anon;
revoke all on public.social_templates           from anon;
revoke all on public.social_facebook_groups     from anon;
revoke all on public.social_group_publish_queue from anon;
revoke all on public.auto_publish_queues        from anon;
revoke all on public.auto_publish_items         from anon;
revoke all on public.auto_publish_log           from anon;
