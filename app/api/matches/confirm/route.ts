import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { scoreId, action, note } = await request.json()

  // Confirm action
  const { error } = await supabase.from('match_confirmations').insert({
    score_id: scoreId,
    confirmed_by: user.id,
    action,
    note: note || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update match_scores status
  await supabase
    .from('match_scores')
    .update({ status: action === 'approved' ? 'confirmed' : 'disputed' })
    .eq('id', scoreId)

  if (action === 'approved') {
    const { data: score } = await supabase
      .from('match_scores')
      .select('match_id, submitted_by, winner_id')
      .eq('id', scoreId)
      .single()

    if (score) {
      const { data: match } = await supabase
        .from('matches')
        .select('id, poule_id, player1_id, player2_id')
        .eq('id', score.match_id)
        .single()

      if (match) {
        await supabase.from('matches').update({ status: 'confirmed' }).eq('id', match.id)

        const loserId = match.player1_id === score.winner_id ? match.player2_id : match.player1_id

        await Promise.all([
          supabase.from('poule_players').update({
            matches_played: supabase.raw('matches_played + 1'),
            matches_won: supabase.raw('matches_won + 1'),
          }).eq('poule_id', match.poule_id).eq('player_id', score.winner_id),
          supabase.from('poule_players').update({
            matches_played: supabase.raw('matches_played + 1'),
            matches_lost: supabase.raw('matches_lost + 1'),
          }).eq('poule_id', match.poule_id).eq('player_id', loserId),
        ])

        const { data: standings } = await supabase
          .from('poule_players')
          .select('id, player_id, matches_won, matches_lost, created_at')
          .eq('poule_id', match.poule_id)

        if (standings) {
          const ordered = [...standings].sort((a: any, b: any) => {
            if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won
            if (a.matches_lost !== b.matches_lost) return a.matches_lost - b.matches_lost
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          })

          for (let index = 0; index < ordered.length; index++) {
            const player = ordered[index]
            await supabase.from('poule_players').update({ position: index + 1 }).eq('id', player.id)
          }
        }

        // Notify submitter
        await supabase.from('notifications').insert({
          user_id: score.submitted_by,
          title: 'Score bevestigd',
          message: 'Je tegenstander heeft de score goedgekeurd.',
          type: 'score_confirmed',
        })
      }
    }
  }

  return NextResponse.json({ success: true })
}
