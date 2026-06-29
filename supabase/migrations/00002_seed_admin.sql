-- ============================================================
-- STAP 1: Voer eerst het hoofd schema uit (00001_initial_schema.sql)
-- STAP 2: Voer daarna DIT script uit in de Supabase SQL editor
-- ============================================================

-- Maak de admin user aan via Supabase Auth Admin API
-- (Dit werkt enkel als je dit uitvoert in de Supabase SQL editor als service_role)

-- Zet Tijs als admin nadat hij zich heeft aangemeld
-- Voer dit uit NA de eerste keer inloggen / registreren

UPDATE public.profiles
SET 
  role = 'admin',
  is_active = true,
  first_name = 'Tijs',
  last_name = 'Peetermans'
WHERE email = 'tijs.peetermans@neuritas-ai.com';

-- Bevestig dat het gelukt is
SELECT id, email, role, is_active, first_name, last_name 
FROM public.profiles 
WHERE email = 'tijs.peetermans@neuritas-ai.com';
