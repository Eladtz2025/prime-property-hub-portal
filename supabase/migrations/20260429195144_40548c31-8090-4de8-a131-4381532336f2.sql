
ALTER TABLE public.scouted_properties
  ADD COLUMN IF NOT EXISTS phone_extraction_status TEXT,
  ADD COLUMN IF NOT EXISTS phone_extraction_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_extracted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_extraction_last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_sp_phone_extraction_queue
ON public.scouted_properties(phone_extraction_attempts, phone_extraction_status)
WHERE is_active = true
  AND is_private = true
  AND (owner_phone IS NULL OR owner_phone = '')
  AND source = 'homeless';

CREATE TABLE IF NOT EXISTS public.phone_extraction_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  source TEXT NOT NULL DEFAULT 'homeless',
  triggered_by TEXT NOT NULL DEFAULT 'cron',
  properties_attempted INTEGER NOT NULL DEFAULT 0,
  phones_found INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  notes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_extraction_runs_started_at
  ON public.phone_extraction_runs(started_at DESC);

ALTER TABLE public.phone_extraction_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view phone extraction runs" ON public.phone_extraction_runs;
CREATE POLICY "Admins can view phone extraction runs"
ON public.phone_extraction_runs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

INSERT INTO public.feature_flags (name, is_enabled, description)
VALUES ('phone_extraction_enabled', false, 'הפעלת/כיבוי worker חילוץ טלפונים מ-Homeless')
ON CONFLICT (name) DO NOTHING;
