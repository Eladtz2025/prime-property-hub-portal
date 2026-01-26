-- ============================================
-- Personal Scout Tables
-- COMPLETELY SEPARATE from scouted_properties and scout_runs
-- ============================================

-- Runs table for personal scout
CREATE TABLE IF NOT EXISTS personal_scout_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending',
  leads_count INTEGER DEFAULT 0,
  leads_completed INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches table for personal scout
CREATE TABLE IF NOT EXISTS personal_scout_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES personal_scout_runs(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES contact_leads(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_url TEXT,
  address TEXT,
  city TEXT,
  neighborhood TEXT,
  price INTEGER,
  rooms NUMERIC,
  floor INTEGER,
  size INTEGER,
  is_private BOOLEAN DEFAULT true,
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_scout_matches_lead_id ON personal_scout_matches(lead_id);
CREATE INDEX IF NOT EXISTS idx_personal_scout_matches_run_id ON personal_scout_matches(run_id);
CREATE INDEX IF NOT EXISTS idx_personal_scout_matches_created_at ON personal_scout_matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_scout_runs_status ON personal_scout_runs(status);
CREATE INDEX IF NOT EXISTS idx_personal_scout_runs_created_at ON personal_scout_runs(created_at DESC);

-- Enable RLS
ALTER TABLE personal_scout_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_scout_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to view
CREATE POLICY "Authenticated users can view personal scout runs"
  ON personal_scout_runs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert personal scout runs"
  ON personal_scout_runs FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update personal scout runs"
  ON personal_scout_runs FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can view personal scout matches"
  ON personal_scout_matches FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert personal scout matches"
  ON personal_scout_matches FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update personal scout matches"
  ON personal_scout_matches FOR UPDATE
  TO authenticated USING (true);

-- Service role policies for edge functions
CREATE POLICY "Service role full access to personal_scout_runs"
  ON personal_scout_runs FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to personal_scout_matches"
  ON personal_scout_matches FOR ALL
  TO service_role USING (true) WITH CHECK (true);