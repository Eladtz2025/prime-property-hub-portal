-- Create message_templates table
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all templates"
ON public.message_templates
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage templates"
ON public.message_templates
FOR ALL
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text, 'manager'::text]));

-- Add trigger for updated_at
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial conversation templates
INSERT INTO public.message_templates (name, content, category, created_by) VALUES
  ('שיחה ראשונית - נעימה', 'היי {שם}, מזמן לא דיברנו! מה שלומך? רציתי לשמוע איך הנכס ב{כתובת}. הכל בסדר? 😊', 'conversation_starter', '00000000-0000-0000-0000-000000000000'),
  ('שיחה ראשונית - עסקית', 'שלום {שם}, הנהלת הנכסים כאן. רציתי להתעדכן לגבי הנכס ב{כתובת}. יש לך זמן קצר לשיחה?', 'conversation_starter', '00000000-0000-0000-0000-000000000000');