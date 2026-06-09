-- Marketing audit P3 (backend correctness).

-- edge-bug (d): persist the "post privately" intent on the row so that a retry
-- driven by social-scheduler (which previously forwarded no is_private) cannot
-- republish a private-intended listing PUBLICLY.
alter table public.social_posts
  add column if not exists is_private boolean not null default false;

-- edge-bug (b): atomic per-slot claim key for auto-publish, so two overlapping
-- runs cannot both publish the same queue/day/time-slot (double-post race).
alter table public.auto_publish_queues
  add column if not exists last_slot_key text;

-- data-1: exactly one social account per platform. Enables an atomic upsert in
-- useSaveSocialAccount and kills the silent-duplicate-row bug that made
-- social-publish's .single() account lookup fail. Safe: currently 1 fb + 1 ig.
alter table public.social_accounts
  add constraint social_accounts_platform_unique unique (platform);
