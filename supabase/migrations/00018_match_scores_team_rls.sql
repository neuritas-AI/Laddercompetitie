-- Migration 00018: Allow team members to view and confirm match scores for doubles

ALTER TABLE public.match_scores DROP POLICY IF EXISTS "Players can view scores of their matches";
CREATE POLICY "Players can view scores of their matches" ON public.match_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m WHERE m.id = match_scores.match_id
      AND (
        m.player1_id = auth.uid()
        OR m.player2_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.player_id = auth.uid()
            AND tm.team_id IN (m.team1_id, m.team2_id)
        )
      )
    )
  );

ALTER TABLE public.match_scores DROP POLICY IF EXISTS "Players can submit scores for their matches";
CREATE POLICY "Players can submit scores for their matches" ON public.match_scores
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m WHERE m.id = match_id
      AND (
        m.player1_id = auth.uid()
        OR m.player2_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.player_id = auth.uid()
            AND tm.team_id IN (m.team1_id, m.team2_id)
        )
      )
    )
  );

ALTER TABLE public.match_confirmations DROP POLICY IF EXISTS "Players can confirm/dispute scores";
CREATE POLICY "Players can confirm/dispute scores" ON public.match_confirmations
  FOR INSERT WITH CHECK (
    confirmed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.match_scores ms
      JOIN public.matches m ON m.id = ms.match_id
      WHERE ms.id = match_confirmations.score_id
        AND (
          m.player1_id = auth.uid()
          OR m.player2_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.player_id = auth.uid()
              AND tm.team_id IN (m.team1_id, m.team2_id)
          )
        )
    )
  );

ALTER TABLE public.match_confirmations DROP POLICY IF EXISTS "Players can view confirmations";
CREATE POLICY "Players can view confirmations" ON public.match_confirmations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_scores ms
      JOIN public.matches m ON m.id = ms.match_id
      WHERE ms.id = match_confirmations.score_id
        AND (
          m.player1_id = auth.uid()
          OR m.player2_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.player_id = auth.uid()
              AND tm.team_id IN (m.team1_id, m.team2_id)
          )
        )
    )
  );
