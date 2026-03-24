
-- Auto-publish queues
CREATE TABLE public.auto_publish_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  queue_type TEXT NOT NULL CHECK (queue_type IN ('property_rotation', 'article_oneshot')),
  platforms JSONB NOT NULL DEFAULT '["facebook_page"]'::jsonb,
  template_text TEXT NOT NULL DEFAULT '',
  hashtags TEXT DEFAULT '',
  publish_time TEXT NOT NULL DEFAULT '10:00',
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  current_index INTEGER NOT NULL DEFAULT 0,
  last_published_at TIMESTAMPTZ,
  next_publish_day INTEGER, -- 0=Sunday..6=Saturday, for weekly queues
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-publish items (for articles only)
CREATE TABLE public.auto_publish_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.auto_publish_queues(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content_text TEXT NOT NULL DEFAULT '',
  image_urls TEXT[] DEFAULT '{}',
  link_url TEXT DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-publish log
CREATE TABLE public.auto_publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.auto_publish_queues(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  item_id UUID REFERENCES public.auto_publish_items(id) ON DELETE SET NULL,
  social_post_id UUID REFERENCES public.social_posts(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  platforms JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published',
  error_message TEXT
);

-- RLS
ALTER TABLE public.auto_publish_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_publish_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_publish_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage queues" ON public.auto_publish_queues FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage items" ON public.auto_publish_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can view logs" ON public.auto_publish_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role needs access for edge function
CREATE POLICY "Service role full access queues" ON public.auto_publish_queues FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access items" ON public.auto_publish_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access logs" ON public.auto_publish_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Updated_at trigger for queues
CREATE TRIGGER update_auto_publish_queues_updated_at
  BEFORE UPDATE ON public.auto_publish_queues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
