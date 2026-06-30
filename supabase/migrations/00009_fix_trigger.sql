-- Fix: Maak de handle_new_user trigger robuust zodat fouten niet 
-- de aanmaak van een gebruiker blokkeren.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    CASE 
      WHEN LOWER(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN 'admin'::user_role 
      ELSE 'player'::user_role 
    END,
    CASE 
      WHEN LOWER(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN true 
      ELSE false 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW()
  ;
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
