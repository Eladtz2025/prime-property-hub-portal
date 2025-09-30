-- Update whatsapp_messages table for Green API compatibility
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS green_api_instance_id text,
ADD COLUMN IF NOT EXISTS receipt_id text,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;

-- Create whatsapp_contacts table for contact management
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL UNIQUE,
  name text,
  last_seen timestamp with time zone,
  is_whatsapp_user boolean DEFAULT false,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on whatsapp_contacts
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for whatsapp_contacts
CREATE POLICY "Admins can manage all contacts" 
ON whatsapp_contacts 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text, 'manager'::text]));

-- Create trigger for updated_at on whatsapp_contacts
CREATE TRIGGER update_whatsapp_contacts_updated_at
BEFORE UPDATE ON whatsapp_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update message_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on message_templates if not already enabled
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Insert default WhatsApp templates
INSERT INTO message_templates (name, content, category, created_by) 
VALUES 
  ('ברכת בוקר', 'בוקר טוב! איך הולך?', 'greeting', '00000000-0000-0000-0000-000000000000'),
  ('פנייה לגבי נכס', 'שלום, אני פונה אליך בנוגע לנכס ב{{address}}. האם נוח לך לשוחח?', 'property', '00000000-0000-0000-0000-000000000000'),
  ('תזכורת תשלום', 'שלום, רק להזכיר על התשלום החודשי. תודה!', 'payment', '00000000-0000-0000-0000-000000000000'),
  ('בדיקת מצב', 'שלום! רק לבדוק איך הולך עם הנכס. הכל בסדר?', 'check', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;