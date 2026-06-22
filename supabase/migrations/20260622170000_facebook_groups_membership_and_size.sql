-- Marketing → "קבוצות פייסבוק" table: track membership status + group size.
--   member_count : how many people are in the group. Entered manually for now
--                  (the publisher extension can auto-fill it later). Lets the
--                  owner see group size and sort by it.
--   is_joined    : lets the owner mark which groups they've already pressed
--                  "Join" on, so the table shows join progress and can be
--                  sorted by it.
--   joined_at    : when the group was marked as joined (for history / sorting).
-- All additive + nullable/defaulted, so existing rows and code keep working.
alter table public.social_facebook_groups
  add column if not exists member_count integer,
  add column if not exists is_joined    boolean not null default false,
  add column if not exists joined_at     timestamptz;
