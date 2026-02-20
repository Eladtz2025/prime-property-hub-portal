UPDATE scout_runs SET status = 'stopped' WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
INSERT INTO scout_runs (id, config_id, source, status, scanner, started_at, page_stats)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '9e55cf4f-7283-4307-8814-341817d72f4a',
  'madlan',
  'running',
  'jina',
  now(),
  '[{"page": 1, "url": "", "status": "pending", "found": 0, "new": 0, "duration_ms": 0}]'::jsonb
)