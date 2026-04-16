-- Fix 1: Expand social_posts status constraint to include 'ready_to_copy'
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_status_check;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_status_check 
  CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'ready_to_copy', 'failed'));

-- Fix stuck posts that failed due to the old constraint
UPDATE social_posts 
SET status = 'ready_to_copy' 
WHERE status = 'publishing' 
  AND created_at > NOW() - INTERVAL '7 days';