-- 1. QA Tests table for manual testing
CREATE TABLE public.qa_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  expected_result TEXT,
  status TEXT DEFAULT 'pending',
  last_tested_at TIMESTAMPTZ,
  tested_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Feature Flags table
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users UUID[],
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Pipeline Runs table
CREATE TABLE public.pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_hash TEXT,
  branch TEXT,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  triggered_by TEXT,
  test_results JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE public.qa_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qa_tests
CREATE POLICY "Admins can manage all qa_tests"
ON public.qa_tests
FOR ALL
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

CREATE POLICY "Admins can insert qa_tests"
ON public.qa_tests
FOR INSERT
WITH CHECK (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- RLS Policies for feature_flags
CREATE POLICY "Admins can manage all feature_flags"
ON public.feature_flags
FOR ALL
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

CREATE POLICY "Authenticated users can view enabled feature_flags"
ON public.feature_flags
FOR SELECT
USING (is_enabled = true OR get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- RLS Policies for pipeline_runs
CREATE POLICY "Admins can manage all pipeline_runs"
ON public.pipeline_runs
FOR ALL
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'));

CREATE POLICY "System can insert pipeline_runs"
ON public.pipeline_runs
FOR INSERT
WITH CHECK (true);

-- Insert default QA tests (50 tests across categories)
INSERT INTO public.qa_tests (category, name, description, expected_result, priority) VALUES
-- Navigation (8 tests)
('navigation', 'תפריט ראשי עובד', 'בדוק שכל הקישורים בתפריט הראשי פועלים', 'כל הקישורים מובילים לדף הנכון', 'high'),
('navigation', 'לוגו מוביל לדף הבית', 'לחץ על הלוגו מכל דף', 'חזרה לדף הבית', 'high'),
('navigation', 'Breadcrumbs עובדים', 'בדוק שה-breadcrumbs מציגים את המיקום הנכון', 'מיקום נכון בכל דף', 'medium'),
('navigation', 'ניווט מובייל', 'בדוק את תפריט ההמבורגר במובייל', 'תפריט נפתח ונסגר תקין', 'high'),
('navigation', 'קישורי footer', 'בדוק את כל הקישורים ב-footer', 'כל הקישורים עובדים', 'medium'),
('navigation', 'החלפת שפה', 'בדוק מעבר בין עברית לאנגלית', 'התוכן משתנה לשפה הנכונה', 'high'),
('navigation', 'דף 404', 'נווט לכתובת שלא קיימת', 'מוצג דף 404 מעוצב', 'medium'),
('navigation', 'Back button', 'בדוק שכפתור חזור בדפדפן עובד', 'חזרה לדף הקודם', 'medium'),

-- Home Page (6 tests)
('home', 'Hero נטען', 'בדוק שתמונת הHero נטענת', 'תמונה מוצגת ללא שגיאות', 'high'),
('home', 'כפתורי CTA', 'בדוק שכפתורי ה-Call to Action עובדים', 'הכפתורים מובילים ליעד הנכון', 'high'),
('home', 'נכסים מומלצים', 'בדוק שרשימת הנכסים המומלצים נטענת', 'הנכסים מוצגים עם תמונות ומחירים', 'high'),
('home', 'טעינת תמונות', 'בדוק שכל התמונות נטענות', 'אין תמונות שבורות', 'medium'),
('home', 'אנימציות', 'בדוק שהאנימציות רצות חלק', 'אנימציות ללא קפיצות', 'low'),
('home', 'זמן טעינה', 'מדוד את זמן הטעינה של הדף', 'פחות מ-3 שניות', 'high'),

-- Properties (10 tests)
('properties', 'רשימת נכסים נטענת', 'בדוק שהנכסים נטענים מהשרת', 'הנכסים מוצגים ברשימה', 'high'),
('properties', 'פילטר לפי מחיר', 'סנן נכסים לפי טווח מחירים', 'רק נכסים בטווח מוצגים', 'high'),
('properties', 'פילטר לפי חדרים', 'סנן נכסים לפי מספר חדרים', 'רק נכסים מתאימים מוצגים', 'high'),
('properties', 'פילטר לפי שכונה', 'סנן נכסים לפי שכונה', 'רק נכסים בשכונה מוצגים', 'high'),
('properties', 'חיפוש טקסט', 'חפש נכס לפי כתובת', 'תוצאות רלוונטיות מוצגות', 'high'),
('properties', 'מיון תוצאות', 'מיין לפי מחיר/תאריך', 'הסדר משתנה בהתאם', 'medium'),
('properties', 'כרטיס נכס', 'בדוק שכל הפרטים מוצגים בכרטיס', 'תמונה, מחיר, כתובת, חדרים', 'high'),
('properties', 'דף פרטי נכס', 'לחץ על נכס ובדוק את דף הפרטים', 'כל הפרטים מוצגים', 'high'),
('properties', 'גלריית תמונות', 'בדוק שהגלריה עובדת בדף נכס', 'ניתן לעבור בין תמונות', 'medium'),
('properties', 'כפתור יצירת קשר', 'בדוק שכפתור יצירת קשר עובד', 'נפתח טופס או WhatsApp', 'high'),

-- Forms (8 tests)
('forms', 'טופס יצירת קשר', 'מלא ושלח את טופס יצירת הקשר', 'הודעת הצלחה מוצגת', 'high'),
('forms', 'ולידציית אימייל', 'הזן אימייל לא תקין', 'הודעת שגיאה מוצגת', 'high'),
('forms', 'ולידציית טלפון', 'הזן טלפון לא תקין', 'הודעת שגיאה מוצגת', 'high'),
('forms', 'שדות חובה', 'נסה לשלוח טופס ריק', 'שגיאות על שדות חובה', 'high'),
('forms', 'טופס תיווך', 'בדוק שטופס התיווך עובד', 'ניתן למלא ולחתום', 'high'),
('forms', 'חתימה דיגיטלית', 'בדוק את קומפוננטת החתימה', 'ניתן לחתום ולמחוק', 'medium'),
('forms', 'העלאת קבצים', 'נסה להעלות קובץ', 'הקובץ נשמר', 'medium'),
('forms', 'שמירה אוטומטית', 'בדוק שיש שמירה אוטומטית', 'הנתונים נשמרים', 'low'),

-- Responsive (6 tests)
('responsive', 'מובייל 375px', 'בדוק את האתר ברוחב 375px', 'התצוגה מותאמת', 'high'),
('responsive', 'טאבלט 768px', 'בדוק את האתר ברוחב 768px', 'התצוגה מותאמת', 'high'),
('responsive', 'דסקטופ 1920px', 'בדוק את האתר ברוחב 1920px', 'התצוגה מותאמת', 'medium'),
('responsive', 'אוריינטציה', 'סובב את המכשיר', 'התצוגה מתאימה את עצמה', 'medium'),
('responsive', 'תמונות רספונסיביות', 'בדוק שתמונות משתנות לפי גודל', 'תמונות מותאמות', 'medium'),
('responsive', 'טקסט קריא', 'בדוק שהטקסט קריא בכל גודל', 'גודל פונט מתאים', 'high'),

-- Accessibility (6 tests)
('accessibility', 'ניווט מקלדת', 'נווט באתר רק עם מקלדת', 'ניתן להגיע לכל אלמנט', 'high'),
('accessibility', 'קורא מסך', 'בדוק עם קורא מסך', 'התוכן נקרא נכון', 'medium'),
('accessibility', 'ניגודיות צבעים', 'בדוק את יחס הניגודיות', 'עומד בתקן WCAG', 'medium'),
('accessibility', 'Alt לתמונות', 'בדוק שלכל תמונה יש alt', 'כל התמונות עם תיאור', 'high'),
('accessibility', 'Focus visible', 'בדוק שיש אינדיקציית focus', 'ברור איזה אלמנט בפוקוס', 'medium'),
('accessibility', 'תוויות לטפסים', 'בדוק שלכל שדה יש label', 'כל השדות מתויגים', 'high'),

-- Authentication (6 tests)
('auth', 'התחברות', 'בדוק תהליך התחברות', 'המשתמש מחובר בהצלחה', 'high'),
('auth', 'התנתקות', 'בדוק תהליך התנתקות', 'המשתמש מנותק', 'high'),
('auth', 'הרשאות אדמין', 'בדוק שרק אדמין רואה דפי ניהול', 'משתמש רגיל לא רואה', 'high'),
('auth', 'שמירת סשן', 'סגור וחזור לאתר', 'הסשן נשמר', 'medium'),
('auth', 'זכור אותי', 'בדוק את אופציית זכור אותי', 'הסשן נשמר לאורך זמן', 'low'),
('auth', 'שחזור סיסמה', 'בדוק תהליך שחזור סיסמה', 'נשלח מייל שחזור', 'high');

-- Create update trigger for qa_tests
CREATE TRIGGER update_qa_tests_updated_at
  BEFORE UPDATE ON public.qa_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create update trigger for feature_flags
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();