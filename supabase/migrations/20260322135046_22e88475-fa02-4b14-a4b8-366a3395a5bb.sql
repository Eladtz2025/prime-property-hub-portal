
-- Social Accounts table
CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  page_id TEXT,
  page_name TEXT,
  ig_user_id TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Social Templates table (must exist before social_posts references it)
CREATE TABLE public.social_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'both' CHECK (platform IN ('facebook', 'instagram', 'both')),
  post_type TEXT NOT NULL DEFAULT 'property_listing' CHECK (post_type IN ('property_listing', 'general_content')),
  template_text TEXT NOT NULL,
  hashtags TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Social Facebook Groups table (must exist before social_posts references it)
CREATE TABLE public.social_facebook_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  group_url TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Social Posts table
CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook_page', 'instagram', 'facebook_group')),
  post_type TEXT NOT NULL DEFAULT 'property_listing' CHECK (post_type IN ('property_listing', 'general_content', 'story', 'reel')),
  content_text TEXT,
  template_id UUID REFERENCES public.social_templates(id) ON DELETE SET NULL,
  image_urls JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_post_id TEXT,
  external_post_url TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  target_group_id UUID REFERENCES public.social_facebook_groups(id) ON DELETE SET NULL,
  hashtags TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger for social_posts
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_facebook_groups ENABLE ROW LEVEL SECURITY;

-- RLS: social_accounts
CREATE POLICY "Admins can manage social_accounts" ON public.social_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS: social_posts
CREATE POLICY "Admins can manage social_posts" ON public.social_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS: social_templates
CREATE POLICY "Admins can manage social_templates" ON public.social_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS: social_facebook_groups
CREATE POLICY "Admins can manage social_facebook_groups" ON public.social_facebook_groups
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
