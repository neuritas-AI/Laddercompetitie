import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendNotification } from '@/app/actions/notifications'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { scoreId, action, note } = await request.json()

  if (!['approved', 'disputed'].includes(action)) {
    return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 })
  }

  const { data: score, error: scoreError } = await supabase
    .from('match_scores')
    .select('id, match_id, submitted_by, winner_id, status')
    .eq('id', scoreId)
    .eq('status', 'pending')
    .single()

  if (scoreError || !score) {
    return NextResponse.json({ error: 'Score niet gevonden of reeds verwerkt' }, { status: 404 })
  }

  if (score.submitted_by === user.id) {
    return NextResponse.json({ error: 'Je kunt je eigen score niet bevestigen.' }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const adminDb = createSupabaseClient(supabaseUrl, serviceRoleKey)

  const { data: match, error: matchError } = await adminDb
    .from('matches')
    .select('id, poule_id, player1_id, player2_id, team1_id, team2_id, status')
    .eq('id', score.match_id)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Wedstrijd niet gevonden' }, { status: 404 })
  }

  if (match.status !== 'played') {
    return NextResponse.json({ error: 'Deze score kan op dit moment niet worden bevestigd.' }, { status: 400 })
  }

  const isPlayerParticipant = match.player1_id === user.id || match.player2_id === user.id
  let isTeamParticipant = false

  if (!isPlayerParticipant && match.team1_id && match.team2_id) {
    const { data: membership, error: membershipError } = await adminDb
      .from('team_members')
      .select('team_id')
      .eq('player_id', user.id)
      .in('team_id', [match.team1_id, match.team2_id])
      .limit(1)
      .maybeSingle()

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 })
    }

    isTeamParticipant = Boolean(membership)
  }

  if (!isPlayerParticipant && !isTeamParticipant) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { data: existingConfirmations, error: confirmationsError } = await supabase
    .from('match_confirmations')
    .select('id, confirmed_by, action')
    .eq('score_id', scoreId)

  if (confirmationsError) return NextResponse.json({ error: confirmationsError.message }, { status: 500 })

  const hasSubmittedPlayerConfirmation = existingConfirmations?.some(
    (confirmation: any) => confirmation.confirmed_by === score.submitted_by
  )

  if (!hasSubmittedPlayerConfirmation) {
    return NextResponse.json({ error: 'Deze score is nog niet door de inzender bevestigd.', status: 400 }, { status: 400 })
  }

  if (existingConfirmations?.some((confirmation: any) => confirmation.confirmed_by === user.id)) {
    return NextResponse.json({ error: 'Je hebt deze score al verwerkt.' }, { status: 409 })
  }

  const { error: confirmationError } = await supabase.from('match_confirmations').insert({
    score_id: scoreId,
    confirmed_by: user.id,
    action,
    note: note || null,
  })

  if (confirmationError) return NextResponse.json({ error: confirmationError.message }, { status: 500 })

  const hasOtherConfirmation = existingConfirmations?.some((confirmation: any) => confirmation.confirmed_by !== user.id)

  if (action === 'approved') {
    if (hasOtherConfirmation) {
      const { error: scoreUpdateError } = await supabase
        .from('match_scores')
        .update({ status: 'confirmed' })
        .eq('id', scoreId)

      if (scoreUpdateError) return NextResponse.json({ error: scoreUpdateError.message }, { status: 500 })

      const { error: matchUpdateError } = await supabase
        .from('matches')
        .update({ status: 'confirmed' })
        .eq('id', match.id)

      if (matchUpdateError) return NextResponse.json({ error: matchUpdateError.message }, { status: 500 })

      const loserId = match.player1_id === score.winner_id ? match.player2_id : match.player1_id
      const raw = (supabase as any).raw?.bind(supabase)

      await Promise.all([
        supabase.from('poule_players').update({
          matches_played: raw ? raw('matches_played + 1') : undefined,
          matches_won: raw ? raw('matches_won + 1') : undefined,
        }).eq('poule_id', match.poule_id).eq('player_id', score.winner_id),
        supabase.from('poule_players').update({
          matches_played: raw ? raw('matches_played + 1') : undefined,
          matches_lost: raw ? raw('matches_lost + 1') : undefined,
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

      await sendNotification(
        score.submitted_by,
        'Score bevestigd',
        'Je tegenstander heeft de score goedgekeurd.',
        'score_confirmed',
        `/matches/${match.id}`,
        match.id
      )
    }
  } else {
    const { error: scoreUpdateError } = await supabase
      .from('match_scores')
      .update({ status: 'disputed' })
      .eq('id', scoreId)

    if (scoreUpdateError) return NextResponse.json({ error: scoreUpdateError.message }, { status: 500 })

    const { error: matchUpdateError } = await supabase
      .from('matches')
      .update({ status: 'disputed' })
      .eq('id', match.id)

    if (matchUpdateError) return NextResponse.json({ error: matchUpdateError.message }, { status: 500 })

    await sendNotification(
      score.submitted_by,
      'Score betwist',
      'Je tegenstander heeft de ingegeven score betwist. Neem contact op om de wedstrijd te herplannen of opnieuw te spelen.',
      'score_entered',
      `/matches/${match.id}`,
      match.id
    )
  }

  return NextResponse.json({ success: true })
}
