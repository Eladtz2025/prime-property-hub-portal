## תיקון גישת taylor.kelly88@gmail.com

### הבעיות שאובחנו
- המשתמשת קיימת כבר ב-`auth.users` מ-3/9/2025 (אימייל מאומת) → ניסיונות הרשמה חדשים מוחזרים שקט בלי מייל.
- ניסיונות login עם `Eladnala12` נכשלים (`Invalid login credentials`) - הסיסמה הישנה שלה אחרת.
- אין לה רשומה ב-`profiles` וב-`user_roles`, ויש הזמנה פעילה כ-`super_admin` שלא נוצלה.

### הפתרון (מיגרציה אחת)

```sql
-- 1) איפוס הסיסמה ל-Eladnala12 + ודא שהאימייל מאומת
UPDATE auth.users
SET 
  encrypted_password = crypt('Eladnala12', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'taylor.kelly88@gmail.com';

-- 2) יצירת profile מאושר
INSERT INTO public.profiles (id, email, full_name, is_approved)
SELECT id, email, 'טיילור', true
FROM auth.users
WHERE email = 'taylor.kelly88@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_approved = true;

-- 3) הוספת role super_admin (מתוך ההזמנה הקיימת)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'taylor.kelly88@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4) סימון ההזמנה כנוצלה
UPDATE public.user_invitations
SET used_at = now()
WHERE email = 'taylor.kelly88@gmail.com' AND used_at IS NULL;
```

### אחרי הביצוע
- טיילור תוכל להיכנס מיד עם `taylor.kelly88@gmail.com` + `Eladnala12`
- היא תקבל גישה מלאה (super_admin)
- לא צריך מייל אישור (האימייל כבר מאומת)

### הערה
כדאי לבקש ממנה לשנות סיסמה אחרי כניסה ראשונה דרך "שכחתי סיסמה" או דרך הגדרות הפרופיל.
