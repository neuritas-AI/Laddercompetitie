-- ============================================================
-- HOTFIX: Voer dit uit in de Supabase SQL Editor
-- Oplossing voor "Database error creating new user"
-- ============================================================

-- Stap 1: Maak first_name en last_name nullable
-- (zodat het aanmaken via het dashboard zonder metadata werkt)
ALTER TABLE public.profiles ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN last_name DROP NOT NULL;

-- Stap 2: Vervang de trigger functie met een veilige versie die COALESCE gebruikt
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    CASE 
      WHEN lower(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN 'admin'::user_role 
      ELSE 'player'::user_role 
    END,
    CASE
      WHEN lower(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN true
      ELSE false
    END
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stap 3: Bevestig dat de trigger nog actief is
-- (dit mag je overslaan als er geen fout komt)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Stap 4: Controleer of alles correct is
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
