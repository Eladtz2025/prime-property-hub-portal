
UPDATE auth.users
SET 
  encrypted_password = crypt('Eladnala12', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'taylor.kelly88@gmail.com';

INSERT INTO public.profiles (id, email, full_name, is_approved)
SELECT id, email, 'טיילור', true
FROM auth.users
WHERE email = 'taylor.kelly88@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_approved = true;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'taylor.kelly88@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.user_invitations
SET used_at = now()
WHERE email = 'taylor.kelly88@gmail.com' AND used_at IS NULL;
