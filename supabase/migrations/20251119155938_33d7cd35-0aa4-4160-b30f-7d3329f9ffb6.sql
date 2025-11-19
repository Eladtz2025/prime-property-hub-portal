-- הרחבת טבלת contact_leads עם שדות CRM
ALTER TABLE contact_leads 
ADD COLUMN IF NOT EXISTS budget_min INTEGER,
ADD COLUMN IF NOT EXISTS budget_max INTEGER,
ADD COLUMN IF NOT EXISTS rooms_min DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS rooms_max DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS preferred_cities TEXT[],
ADD COLUMN IF NOT EXISTS preferred_neighborhoods TEXT[],
ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'rental',
ADD COLUMN IF NOT EXISTS move_in_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_followup_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- יצירת טבלת property_interests
CREATE TABLE IF NOT EXISTS property_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES contact_leads(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  interest_level TEXT DEFAULT 'interested',
  notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lead_id, property_id)
);

-- Enable RLS
ALTER TABLE property_interests ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_interests
CREATE POLICY "Admins can manage property interests"
ON property_interests
FOR ALL
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text, 'manager'::text]));

-- Trigger לעדכון updated_at
CREATE OR REPLACE FUNCTION update_contact_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_contact_leads_updated_at
BEFORE UPDATE ON contact_leads
FOR EACH ROW
EXECUTE FUNCTION update_contact_leads_updated_at();