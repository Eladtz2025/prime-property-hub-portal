-- Create the group publish queue table
CREATE TABLE public.social_group_publish_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.social_facebook_groups(id) ON DELETE SET NULL,
  group_url TEXT NOT NULL,
  group_name TEXT NOT NULL,
  content_text TEXT NOT NULL,
  image_urls JSONB DEFAULT '[]'::jsonb,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient polling: get next pending post by time
CREATE INDEX idx_group_publish_queue_pending 
  ON public.social_group_publish_queue (scheduled_at ASC) 
  WHERE status = 'pending';

-- Index for stats queries
CREATE INDEX idx_group_publish_queue_status 
  ON public.social_group_publish_queue (status, created_at DESC);

-- Enable RLS
ALTER TABLE public.social_group_publish_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view group publish queue"
  ON public.social_group_publish_queue
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert group publish queue"
  ON public.social_group_publish_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update group publish queue"
  ON public.social_group_publish_queue
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete group publish queue"
  ON public.social_group_publish_queue
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));