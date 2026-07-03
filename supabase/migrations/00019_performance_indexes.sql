-- Migration 019: performance indexes
--
-- These columns are filtered on in every player-facing page load (dashboard,
-- matches, ranking, score confirmation) but had no index besides their primary
-- keys and the unique(poule_id, player_id) constraint on poule_players (which
-- doesn't help lookups by player_id alone). Postgres does not automatically
-- index foreign key columns, so these were full/partial table scans.

-- matches: looked up by participant, by poule, and filtered by status on
-- almost every player page (dashboard, /matches, admin match list).
CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON public.matches (player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON public.matches (player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_poule_status ON public.matches (poule_id, status);

-- poule_players: looked up by player_id alone on layout/dashboard/matches/ranking
-- for every request; the existing unique index leads with poule_id so it can't
-- serve these lookups efficiently.
CREATE INDEX IF NOT EXISTS idx_poule_players_player_id ON public.poule_players (player_id);

-- match_scores: looked up by match_id (score entry/confirm flows) and filtered
-- by status ('pending') to find the outstanding score for a match.
CREATE INDEX IF NOT EXISTS idx_match_scores_match_id ON public.match_scores (match_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_match_status ON public.match_scores (match_id, status);

-- match_confirmations: looked up by score_id on every confirm/dispute action.
CREATE INDEX IF NOT EXISTS idx_match_confirmations_score_id ON public.match_confirmations (score_id);

-- team_members: looked up by player_id to check double-match participation.
CREATE INDEX IF NOT EXISTS idx_team_members_player_id ON public.team_members (player_id);

SELECT 'performance indexes aangemaakt' AS status;
