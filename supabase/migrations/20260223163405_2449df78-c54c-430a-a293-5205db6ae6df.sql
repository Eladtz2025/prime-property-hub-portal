UPDATE availability_check_runs
SET status = 'stopped', completed_at = now()
WHERE id = '5e626233-e942-4329-94aa-79ec1a77043a'
AND status = 'running';