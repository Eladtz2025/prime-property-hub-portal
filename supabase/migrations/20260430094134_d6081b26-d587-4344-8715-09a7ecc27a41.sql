INSERT INTO public.feature_flags (name, description, is_enabled)
VALUES (
  'backfill_madlan_disabled',
  'When ON, the backfill (Jina) function skips properties from source=madlan to avoid wasting attempts while Madlan returns HTTP 403. Turn OFF once the Madlan fetcher is fixed.',
  true
)
ON CONFLICT (name) DO NOTHING;