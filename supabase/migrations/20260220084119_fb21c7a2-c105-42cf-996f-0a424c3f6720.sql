UPDATE scout_runs SET status = 'stopped' WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
INSERT INTO scout_runs (id, config_id, source, status, scanner, started_at, page_stats)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'dd7a66d5-52fd-4e8b-9858-1ad560d69900',
  'madlan',
  'running',
  'jina',
  now(),
  '[{"page": 6, "url": "", "status": "pending", "found": 0, "new": 0, "duration_ms": 0}]'::jsonb
)