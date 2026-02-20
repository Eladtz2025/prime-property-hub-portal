UPDATE scout_runs SET status = 'stopped' WHERE id = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
INSERT INTO scout_runs (id, config_id, source, status, scanner, started_at, page_stats)
VALUES (
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'dd7a66d5-52fd-4e8b-9858-1ad560d69900',
  'madlan',
  'running',
  'jina',
  now(),
  '[{"page": 3, "url": "", "status": "pending", "found": 0, "new": 0, "duration_ms": 0}]'::jsonb
)