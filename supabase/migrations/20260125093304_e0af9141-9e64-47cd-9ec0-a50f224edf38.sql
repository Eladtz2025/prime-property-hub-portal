-- Create debug table for storing raw HTML/Markdown samples from successful scrapes
CREATE TABLE public.debug_scrape_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text UNIQUE NOT NULL,
  url text,
  html text,
  markdown text,
  properties_found integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debug_scrape_samples ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role has full access to debug_scrape_samples"
ON public.debug_scrape_samples
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.debug_scrape_samples IS 'Stores raw HTML/Markdown samples from successful scrapes for parser debugging';