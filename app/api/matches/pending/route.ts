import { createClientWithUser } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface MatchScoreRow {
  id: string
  p1_score: number
  p2_score: number
  submitted_by: string
  status: string
  created_at: string
}

interface MatchRow {
  id: string
  scheduled_date: string | null
  location: string | null
  status: string
  score_player1: string | null
  score_player2: string | null
  winner_id: string | null
  player1_id: string
  player2_id: string
  player1: unknown
  player2: unknown
  poule: unknown
  period: unknown
  match_scores: MatchScoreRow[] | null
}

export async function GET() {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  // Fetch matches with a pending score ('played') or an unresolved dispute
  // ('disputed') where the user is a participant.
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      scheduled_date,
      location,
      status,
      score_player1,
      score_player2,
      winner_id,
      player1_id,
      player2_id,
      player1:profiles!matches_player1_id_fkey(first_name, last_name, avatar_url, phone, share_phone),
      player2:profiles!matches_player2_id_fkey(first_name, last_name, avatar_url, phone, share_phone),
      poule:poules(name),
      period:competition_periods(period_number),
      match_scores(id, p1_score, p2_score, submitted_by, status, created_at)
    `)
    .in('status', ['played', 'disputed'])
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const matchRows = (matches ?? []) as unknown as MatchRow[]

  // For disputed matches, the player who disputed the latest score is the one
  // who must submit the correction. Batch-fetch the dispute action for those
  // scores to figure out who that is.
  const latestScoreByMatch = new Map<string, MatchScoreRow>()
  for (const m of matchRows) {
    const scores = m.match_scores ?? []
    const latest = [...scores].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
    if (latest) latestScoreByMatch.set(m.id, latest)
  }

  const disputedScoreIds = Array.from(latestScoreByMatch.values())
    .filter((s) => s.status === 'disputed')
    .map((s) => s.id)

  const { data: disputeActions } = disputedScoreIds.length
    ? await supabase
        .from('match_confirmations')
        .select('score_id, confirmed_by')
        .in('score_id', disputedScoreIds)
        .eq('action', 'disputed')
    : { data: [] as { score_id: string; confirmed_by: string }[] }

  const disputerByScoreId = new Map<string, string>()
  for (const row of disputeActions ?? []) {
    disputerByScoreId.set(row.score_id, row.confirmed_by)
  }

  // `canConfirm`/`canRescore` tell the client whether the current user is the
  // one who still needs to act (confirm/dispute a pending score, or submit the
  // correction for a disputed one).
  const filtered = matchRows
    .map((m) => {
      const latest = latestScoreByMatch.get(m.id)
      if (!latest) return null
      if (m.status === 'played' && latest.status === 'pending') {
        return { m, needsRescore: false, canConfirm: latest.submitted_by !== user.id, canRescore: false }
      }
      if (m.status === 'disputed' && latest.status === 'disputed') {
        const disputerId = disputerByScoreId.get(latest.id)
        return { m, needsRescore: true, canConfirm: false, canRescore: disputerId === user.id }
      }
      return null
    })
    .filter((entry): entry is { m: MatchRow; needsRescore: boolean; canConfirm: boolean; canRescore: boolean } => entry !== null)
    .map(({ m, needsRescore, canConfirm, canRescore }) => ({
      id: m.id,
      scheduled_date: m.scheduled_date,
      location: m.location,
      status: m.status,
      score_player1: m.score_player1,
      score_player2: m.score_player2,
      winner_id: m.winner_id,
      player1_id: m.player1_id,
      player2_id: m.player2_id,
      player1: Array.isArray(m.player1) ? m.player1[0] : m.player1,
      player2: Array.isArray(m.player2) ? m.player2[0] : m.player2,
      poule: m.poule,
      period: m.period,
      canConfirm,
      needsRescore,
      canRescore,
    }))

  return NextResponse.json({ matches: filtered })
}
