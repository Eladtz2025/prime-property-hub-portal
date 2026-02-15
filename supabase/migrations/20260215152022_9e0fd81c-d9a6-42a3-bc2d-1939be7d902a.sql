
CREATE TABLE public.firecrawl_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  api_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted')),
  priority INTEGER NOT NULL DEFAULT 1,
  exhausted_at TIMESTAMPTZ,
  total_uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: only service role access (edge functions use service role key)
ALTER TABLE public.firecrawl_api_keys ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service_role can access (edge functions)
COMMENT ON TABLE public.firecrawl_api_keys IS 'Firecrawl API keys for automatic rotation when rate limited';
