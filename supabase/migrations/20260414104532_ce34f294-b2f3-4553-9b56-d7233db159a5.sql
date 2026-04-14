UPDATE auto_publish_queues 
SET last_published_at = (now() - interval '1 day'), 
    publish_time = '13:55'
WHERE id = '8d1974d0-b044-41f3-8f63-278a65cfed6c';