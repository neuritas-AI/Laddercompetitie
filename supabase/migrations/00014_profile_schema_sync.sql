-- Migration 00014: Align profile schema and role access
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS share_phone boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid references public.profiles(id) on delete cascade not null,
  role_id uuid references public.roles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, role_id)
);

INSERT INTO public.roles (name)
VALUES ('player'), ('admin'), ('club_manager'), ('competition_leader')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT p.id, r.id
FROM public.profiles p
JOIN public.roles r ON r.name = 'player'
WHERE p.role = 'player' AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role_id = r.id
);

INSERT INTO public.user_roles (user_id, role_id)
SELECT p.id, r.id
FROM public.profiles p
JOIN public.roles r ON r.name = 'admin'
WHERE p.role = 'admin' AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role_id = r.id
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, is_active, share_phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    CASE WHEN LOWER(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN 'admin'::user_role ELSE 'player'::user_role END,
    CASE WHEN LOWER(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN true ELSE false END,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
