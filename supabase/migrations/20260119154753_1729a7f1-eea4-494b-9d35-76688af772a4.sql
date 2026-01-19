-- Create scout_settings table for configurable parameters
CREATE TABLE public.scout_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,           -- 'duplicates', 'matching', 'scraping'
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(category, setting_key)
);

-- Enable RLS
ALTER TABLE public.scout_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow authenticated users to read, only admins to write
CREATE POLICY "Anyone can view scout settings"
  ON public.scout_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update scout settings"
  ON public.scout_settings
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert scout settings"
  ON public.scout_settings
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default values
INSERT INTO public.scout_settings (category, setting_key, setting_value, description) VALUES
  -- Duplicate detection settings
  ('duplicates', 'price_diff_threshold', '0.20', 'סף הפרש מחיר באחוזים (0.20 = 20%)'),
  ('duplicates', 'size_diff_threshold', '0.10', 'סף הפרש גודל באחוזים (0.10 = 10%)'),
  ('duplicates', 'require_same_floor', 'false', 'דרוש קומה זהה לזיהוי כפילות'),
  ('duplicates', 'auto_create_alerts', 'true', 'יצירת התראות אוטומטית לכפילויות'),
  ('duplicates', 'min_price_diff_for_alert', '5', 'הפרש מחיר מינימלי באחוזים ליצירת התראה'),
  
  -- Matching settings
  ('matching', 'min_score', '60', 'ציון מינימלי להתאמה'),
  ('matching', 'max_matches_per_property', '20', 'מקסימום התאמות לנכס'),
  ('matching', 'flexible_price_threshold', '0.15', 'אחוז גמישות מחיר מעל תקציב'),
  ('matching', 'auto_send_whatsapp', 'false', 'שליחה אוטומטית לוואטסאפ'),
  
  -- Scraping settings
  ('scraping', 'yad2_pages', '7', 'מספר דפים לסריקה ב-Yad2'),
  ('scraping', 'madlan_pages', '4', 'מספר דפים לסריקה ב-Madlan (מופחת למניעת חסימה)'),
  ('scraping', 'homeless_pages', '0', 'מספר דפים לסריקה ב-Homeless (0 = מושבת)'),
  ('scraping', 'delay_between_requests_ms', '1500', 'השהייה בין בקשות במילישניות'),
  ('scraping', 'madlan_delay_ms', '5000', 'השהייה בין בקשות למאדלן (ארוך יותר)'),
  ('scraping', 'stuck_timeout_minutes', '30', 'timeout לסריקות תקועות בדקות'),
  ('scraping', 'max_properties_per_config', '500', 'מקסימום נכסים לכל קונפיגורציה');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_scout_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_scout_settings_updated_at
  BEFORE UPDATE ON public.scout_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scout_settings_updated_at();