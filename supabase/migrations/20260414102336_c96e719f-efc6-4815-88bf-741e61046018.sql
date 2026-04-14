-- Fix the existing queue: set post_style to 'photos' and reset current_index to reflect actual successful publishes
UPDATE auto_publish_queues 
SET post_style = 'photos', current_index = 1
WHERE id = '8d1974d0-b044-41f3-8f63-278a65cfed6c';