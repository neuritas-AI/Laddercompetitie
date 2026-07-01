import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { matchId, p1Score, p2Score } = await request.json()

  if (p1Score === undefined || p2Score === undefined || p1Score < 0 || p2Score < 0) {
    return NextResponse.json({ error: 'Ongeldige score' }, { status: 400 })
  }
  if (p1Score === p2Score) {
    return NextResponse.json({ error: 'Gelijkspel is niet toegestaan. Er moet een winnaar zijn.' }, { status: 400 })
  }

  // Validate match belongs to user
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, player1_id, player2_id, status')
    .eq('id', matchId)
    .single()

  if (matchError || !match) return NextResponse.json({ error: 'Wedstrijd niet gevonden' }, { status: 404 })
  if (match.player1_id !== user.id && match.player2_id !== user.id) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
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

  // Update match with entered score and mark as played pending confirmation
  const { error: matchUpdateError } = await supabase
    .from('matches')
    .update({
      status: 'played',
      winner_id: winnerId,
      score_player1: String(p1Score),
      score_player2: String(p2Score),
    })
    .eq('id', matchId)

  if (matchUpdateError) {
    return NextResponse.json({ error: matchUpdateError.message }, { status: 500 })
  }

  // Create notification for opponent
  const opponentId = match.player1_id === user.id ? match.player2_id : match.player1_id
  await supabase.from('notifications').insert({
    user_id: opponentId,
    title: 'Score ingegeven',
    message: 'Je tegenstander heeft een score ingegeven. Controleer en bevestig de score.',
    type: 'score_entered',
    link_url: `/matches/${matchId}/confirm`,
  })

  return NextResponse.json({ success: true, scoreId: score.id })
}
