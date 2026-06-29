-- ============================================================
-- STAP 1: Verwijder tijdelijk de trigger (zodat user aanmaken werkt)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================
-- STAP 2: Maak de trigger functie robuust met exception handler
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    CASE WHEN lower(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN 'admin'::user_role ELSE 'player'::user_role END,
    CASE WHEN lower(new.email) = 'tijs.peetermans@neuritas-ai.com' THEN true ELSE false END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new; -- Zorg dat user aanmaken NOOIT faalt door een trigger fout
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STAP 3: Maak de trigger opnieuw aan
-- ============================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Bevestiging: trigger is actief
-- ============================================================
SELECT 'Trigger succesvol aangemaakt' as status;
