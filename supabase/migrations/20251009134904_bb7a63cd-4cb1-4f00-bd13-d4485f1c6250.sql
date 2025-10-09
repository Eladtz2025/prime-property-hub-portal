-- Add missing columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
ADD COLUMN IF NOT EXISTS building_floors INTEGER,
ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS elevator BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS balcony BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'rental',
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add constraint for property_type
ALTER TABLE properties
ADD CONSTRAINT properties_property_type_check 
CHECK (property_type IN ('rental', 'sale', 'management'));

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_main BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on property_images
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_images
CREATE POLICY "Anyone can view property images"
  ON property_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage property images"
  ON property_images FOR ALL
  USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text, 'manager'::text]));

-- Create contact_leads table
CREATE TABLE IF NOT EXISTS contact_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on contact_leads
ALTER TABLE contact_leads ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_leads
CREATE POLICY "Anyone can submit contact leads"
  ON contact_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all contact leads"
  ON contact_leads FOR SELECT
  USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text, 'manager'::text]));