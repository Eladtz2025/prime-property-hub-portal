

## תוכנית: תיקון RLS על טבלת scout_runs — היסטוריית סריקות לא מוצגת

### שורש הבעיה

טבלת `scout_runs` מוגדרת עם RLS מופעל, אבל יש רק פוליסה אחת: **"Service role can manage scout_runs"** (ALL, qual: true). אין פוליסה ל-`authenticated` users, כך שכשה-UI שולח שאילתה מהדפדפן (כמשתמש מחובר), הוא מקבל 0 תוצאות.

הנתונים עצמם קיימים ותקינים — כל הסריקות רצו כרגיל (אתמול 11/4, היום 12/4). **הבעיה היא רק הצגה.**

### תיקון

הוספת מיגרציה עם RLS policy ל-SELECT על `scout_runs` עבור admin/super_admin/manager — בדיוק כמו הפוליסה הקיימת על `scout_configs`:

```sql
CREATE POLICY "Admins can view scout runs"
ON public.scout_runs
FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'admin', 'manager'));
```

### השפעה
- ה-dialog של "היסטוריית סריקות" יתחיל להציג את כל הריצות
- אפס סיכון — הוספת פוליסה בלבד, לא משנה שום לוגיקה

