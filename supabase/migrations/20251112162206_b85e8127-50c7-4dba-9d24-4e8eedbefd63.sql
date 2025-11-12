-- שלב 1: תיקון הפונקציה get_current_user_role()
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT ur.role::text 
      FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
      ORDER BY 
        CASE ur.role
          WHEN 'super_admin' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'manager' THEN 3
          WHEN 'property_owner' THEN 4
          WHEN 'viewer' THEN 5
        END
      LIMIT 1
    ),
    'viewer'
  );
$$;

-- שלב 2: תיקון RLS Policies ל-brokerage_form_tokens
DROP POLICY IF EXISTS "Admins can manage all tokens" ON brokerage_form_tokens;

CREATE POLICY "Admins can create and manage tokens"
ON brokerage_form_tokens
FOR ALL
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['admin', 'super_admin', 'manager'])
)
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['admin', 'super_admin', 'manager'])
);

-- שלב 5: הוספת rate limiting למניעת spam
CREATE OR REPLACE FUNCTION check_brokerage_form_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_forms_count INTEGER;
BEGIN
  -- בדוק כמה טפסים המשתמש יצר ב-10 הדקות האחרונות
  SELECT COUNT(*) INTO recent_forms_count
  FROM brokerage_forms
  WHERE created_by = NEW.created_by
  AND created_at > NOW() - INTERVAL '10 minutes';
  
  IF recent_forms_count >= 5 THEN
    RAISE EXCEPTION 'יצרת יותר מדי טפסים לאחרונה. אנא המתן 10 דקות.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brokerage_form_rate_limit_trigger ON brokerage_forms;
CREATE TRIGGER brokerage_form_rate_limit_trigger
  BEFORE INSERT ON brokerage_forms
  FOR EACH ROW
  EXECUTE FUNCTION check_brokerage_form_rate_limit();