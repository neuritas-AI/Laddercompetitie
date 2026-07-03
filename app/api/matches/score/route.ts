import { createClientWithUser } from '@/utils/supabase/server'
import { sendNotification } from '@/app/actions/notifications'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { matchId, p1Score, p2Score } = await request.json()

  if (p1Score === undefined || p2Score === undefined || p1Score < 0 || p2Score < 0) {
    return NextResponse.json({ error: 'Ongeldige score' }, { status: 400 })
  }
  if (p1Score === p2Score) {
    return NextResponse.json({ error: 'Gelijkspel is niet toegestaan. Er moet een winnaar zijn.' }, { status: 400 })
  }

  // Validate match belongs to user and is ready for score entry. These two reads
  // don't depend on each other, so fetch them concurrently instead of in sequence.
  const [{ data: match, error: matchError }, { data: existingPending }] = await Promise.all([
    supabase
      .from('matches')
      .select('id, player1_id, player2_id, status')
      .eq('id', matchId)
      .single(),
    supabase
      .from('match_scores')
      .select('id')
      .eq('match_id', matchId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle(),
  ])

  if (matchError || !match) return NextResponse.json({ error: 'Wedstrijd niet gevonden' }, { status: 404 })
  if (match.player1_id !== user.id && match.player2_id !== user.id) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }
  if (match.status !== 'scheduled') {
    return NextResponse.json({ error: 'Score kan alleen ingevoerd worden voor een geplande wedstrijd.' }, { status: 400 })
  }

  if (existingPending) {
    return NextResponse.json({ error: 'Er staat al een score klaar voor deze wedstrijd. Laat je tegenstander deze bevestigen of betwisten.' }, { status: 409 })
  }

  // Calculate winner
  const winnerId = p1Score > p2Score ? match.player1_id : match.player2_id

  // Insert score record
  const { data: score, error: scoreError } = await supabase
    .from('match_scores')
    .insert({
      match_id: matchId,
      submitted_by: user.id,
      p1_score: p1Score,
      p2_score: p2Score,
      winner_id: winnerId,
      status: 'pending',
    })
    .select()
    .single()

  if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 })

  // Auto-confirm on behalf of the submitter, mark the match as played, and notify
  // the opponent. None of these three depend on each other, so run them concurrently.
  const opponentId = match.player1_id === user.id ? match.player2_id : match.player1_id
  const [{ error: autoConfirmError }, { error: matchUpdateError }] = await Promise.all([
    supabase.from('match_confirmations').insert({
      score_id: score.id,
      confirmed_by: user.id,
      action: 'approved',
      note: null,
    }),
    supabase
      .from('matches')
      .update({
        status: 'played',
        winner_id: winnerId,
        score_player1: String(p1Score),
        score_player2: String(p2Score),
      })
      .eq('id', matchId),
    sendNotification(
      opponentId,
      'Score ingegeven',
      'Je tegenstander heeft een score ingegeven. Controleer en bevestig de score.',
      'score_entered',
      `/matches/${matchId}/confirm`,
      matchId
    ),
  ])

  if (autoConfirmError) return NextResponse.json({ error: autoConfirmError.message }, { status: 500 })
  if (matchUpdateError) return NextResponse.json({ error: matchUpdateError.message }, { status: 500 })

  return NextResponse.json({ success: true, scoreId: score.id })
}
