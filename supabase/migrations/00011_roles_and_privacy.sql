-- Migration 00011: Roles and Privacy
-- Run this in the Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_player boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_phone boolean DEFAULT false;

-- 1. Migrate existing admins
UPDATE public.profiles
SET is_admin = true
WHERE role = 'admin' OR email = 'tijs.peetermans@neuritas-ai.com';

-- 2. Update the trigger to populate is_admin and is_player
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, is_active, is_admin, is_player)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    CASE WHEN LOWER(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN 'admin'::user_role ELSE 'player'::user_role END,
    CASE WHEN LOWER(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN true ELSE false END,
    CASE WHEN LOWER(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN true ELSE false END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    updated_at = NOW();
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
