-- ============================================================
-- Migration 005: match_scores, match_confirmations
-- Voer uit in Supabase SQL Editor
-- ============================================================

-- match_scores: bewaart set-scores per wedstrijd
CREATE TABLE IF NOT EXISTS public.match_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  submitted_by uuid REFERENCES public.profiles(id) NOT NULL,
  sets jsonb NOT NULL, -- [{p1: 6, p2: 4}, {p1: 3, p2: 6}, ...]
  winner_id uuid REFERENCES public.profiles(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- match_confirmations: goedkeuring of betwisting door tegenstander
CREATE TABLE IF NOT EXISTS public.match_confirmations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  score_id uuid REFERENCES public.match_scores(id) ON DELETE CASCADE NOT NULL,
  confirmed_by uuid REFERENCES public.profiles(id) NOT NULL,
  action text NOT NULL CHECK (action IN ('approved', 'disputed')),
  note text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view scores of their matches" ON public.match_scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_scores.match_id
      AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid()))
  );
CREATE POLICY "Players can submit scores for their matches" ON public.match_scores
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id
      AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid()))
  );
CREATE POLICY "Admins manage all scores" ON public.match_scores
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

ALTER TABLE public.match_confirmations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can confirm/dispute scores" ON public.match_confirmations
  FOR INSERT WITH CHECK (confirmed_by = auth.uid());
CREATE POLICY "Players can view confirmations" ON public.match_confirmations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_scores ms
      JOIN public.matches m ON m.id = ms.match_id
      WHERE ms.id = match_confirmations.score_id
        AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
    )
  );
CREATE POLICY "Admins manage all confirmations" ON public.match_confirmations
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

SELECT 'match_scores en match_confirmations aangemaakt' AS status;
