ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS green_api_instance_id text,
ADD COLUMN IF NOT EXISTS green_api_token text;