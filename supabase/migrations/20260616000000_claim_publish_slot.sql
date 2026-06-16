-- Atomic per-slot claim for the auto-publish rotation.
--
-- Replaces the broken supabase-js claim in the auto-publish edge function:
--   .update({ last_slot_key }).eq('id', id).or('last_slot_key.is.null,last_slot_key.neq.<key>')
-- which returned an EMPTY result set even when last_slot_key was NULL, so every in-window
-- run skipped with "Slot ... already handled" and NOTHING was ever published (the FB
-- business-page auto-poster was silently dead from 2026-04-26 — diagnosed 2026-06-16).
--
-- The conditional UPDATE is evaluated in Postgres here, where the predicate is correct.
-- Returns true if THIS call claimed the slot (the queue had no key yet, or a different
-- slot), false if the slot was already claimed for this queue/day/time.
CREATE OR REPLACE FUNCTION public.claim_publish_slot(p_queue_id uuid, p_slot_key text)
RETURNS boolean
LANGUAGE sql
AS $$
  WITH upd AS (
    UPDATE public.auto_publish_queues
       SET last_slot_key = p_slot_key
     WHERE id = p_queue_id
       AND (last_slot_key IS NULL OR last_slot_key <> p_slot_key)
    RETURNING id
  )
  SELECT EXISTS (SELECT 1 FROM upd);
$$;

-- Lock down: only the service-role (used by the auto-publish edge function) may execute.
-- Deliberately NOT SECURITY DEFINER (runs as caller) and never exposed to anon/authenticated.
-- Supabase default privileges auto-grant EXECUTE to anon/authenticated on new public
-- functions, so revoke them explicitly (not just PUBLIC).
REVOKE EXECUTE ON FUNCTION public.claim_publish_slot(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.claim_publish_slot(uuid, text) TO service_role;
