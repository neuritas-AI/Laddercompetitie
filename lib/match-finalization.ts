import type { SupabaseClient } from '@supabase/supabase-js'

export interface FinalizeMatchScoreParams {
  scoreId: string
  matchId: string
  pouleId: string
  player1Id: string
  player2Id: string
  winnerId: string
}

// Marks a match_scores row (and its match) as confirmed, updates the winner's
// and loser's poule stats, and recomputes standings/positions for the whole
// poule. Shared between the manual confirm route and the 24h auto-confirm
// cron job so both paths finalize a match identically.
//
// Only updates `poule_players` (singles) — doubles matches don't yet get
// their `team_poules` stats updated on confirmation, matching the existing
// (pre-existing, out of scope here) behavior of the manual confirm flow.
export async function finalizeMatchScore(
  adminDb: SupabaseClient,
  { scoreId, matchId, pouleId, player1Id, player2Id, winnerId }: FinalizeMatchScoreParams
): Promise<{ success: boolean; error?: string }> {
  const [{ error: scoreUpdateError }, { error: matchUpdateError }] = await Promise.all([
    adminDb.from('match_scores').update({ status: 'confirmed' }).eq('id', scoreId),
    adminDb.from('matches').update({ status: 'confirmed' }).eq('id', matchId),
  ])
  if (scoreUpdateError) return { success: false, error: scoreUpdateError.message }
  if (matchUpdateError) return { success: false, error: matchUpdateError.message }

  const loserId = player1Id === winnerId ? player2Id : player1Id

  const { data: participants, error: participantsError } = await adminDb
    .from('poule_players')
    .select('id, player_id, matches_played, matches_won, matches_lost')
    .eq('poule_id', pouleId)
    .in('player_id', [winnerId, loserId])
  if (participantsError) return { success: false, error: participantsError.message }

  const winnerRow = participants?.find((p) => p.player_id === winnerId)
  const loserRow = participants?.find((p) => p.player_id === loserId)

  const statUpdates = []
  if (winnerRow) {
    statUpdates.push(
      adminDb
        .from('poule_players')
        .update({
          matches_played: winnerRow.matches_played + 1,
          matches_won: winnerRow.matches_won + 1,
        })
        .eq('id', winnerRow.id)
    )
  }
  if (loserRow) {
    statUpdates.push(
      adminDb
        .from('poule_players')
        .update({
          matches_played: loserRow.matches_played + 1,
          matches_lost: loserRow.matches_lost + 1,
        })
        .eq('id', loserRow.id)
    )
  }
  for (const result of await Promise.all(statUpdates)) {
    if (result.error) return { success: false, error: result.error.message }
  }

  const { data: standings, error: standingsError } = await adminDb
    .from('poule_players')
    .select('id, player_id, matches_won, matches_lost, created_at')
    .eq('poule_id', pouleId)
  if (standingsError) return { success: false, error: standingsError.message }

  if (standings) {
    // Ranking points: a win is worth 2 points, a loss is worth 0. Since every
    // player in a poule has played the same fixture list, points are directly
    // proportional to matches_won, so sorting on matches_won produces the same
    // order. Fewer losses breaks ties on equal points.
    const ordered = [...standings].sort((a, b) => {
      const pointsA = a.matches_won * 2
      const pointsB = b.matches_won * 2
      if (pointsB !== pointsA) return pointsB - pointsA
      if (a.matches_lost !== b.matches_lost) return a.matches_lost - b.matches_lost
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    const positionResults = await Promise.all(
      ordered.map((player, index) => adminDb.from('poule_players').update({ position: index + 1 }).eq('id', player.id))
    )
    const positionError = positionResults.find((r) => r.error)?.error
    if (positionError) return { success: false, error: positionError.message }
  }

  return { success: true }
}
