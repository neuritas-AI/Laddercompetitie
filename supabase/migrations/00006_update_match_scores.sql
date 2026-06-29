-- ============================================================
-- Migration 006: Update match_scores for time-based games
-- Voer uit in Supabase SQL Editor
-- ============================================================

-- Verwijder eerst eventuele bestaande test-scores om conflicten te vermijden
DELETE FROM public.match_confirmations;
DELETE FROM public.match_scores;

-- Pas de tabel aan: verwijder 'sets' en voeg score kolommen toe
ALTER TABLE public.match_scores DROP COLUMN IF EXISTS sets;
ALTER TABLE public.match_scores ADD COLUMN p1_score integer NOT NULL;
ALTER TABLE public.match_scores ADD COLUMN p2_score integer NOT NULL;

-- Voeg validatie toe: scores mogen niet negatief zijn en gelijkspel mag niet
ALTER TABLE public.match_scores ADD CONSTRAINT check_positive_scores CHECK (p1_score >= 0 AND p2_score >= 0);
ALTER TABLE public.match_scores ADD CONSTRAINT check_no_ties CHECK (p1_score != p2_score);

SELECT 'match_scores tabel succesvol aangepast naar time-based games' AS status;
