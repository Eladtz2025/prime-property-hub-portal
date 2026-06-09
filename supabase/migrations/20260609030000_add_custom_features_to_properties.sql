-- Custom feature badges (free-text tags) for properties.
-- Rendered as orange badges on the public listing cards and the property detail page,
-- edited from the "תוספות → תוויות מותאמות" section of the property edit row.
alter table public.properties
  add column if not exists custom_features text[] not null default '{}'::text[];
