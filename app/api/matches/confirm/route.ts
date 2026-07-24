import { createClientWithUser } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendNotification } from '@/app/actions/notifications'
import { finalizeMatchScore } from '@/lib/match-finalization'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

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

  // The match lookup and the existing-confirmations check don't depend on each
  // other (both only need scoreId/score.match_id, known at this point), so run
  // them concurrently instead of sequentially.
  const [
    { data: match, error: matchError },
    { data: existingConfirmations, error: confirmationsError },
  ] = await Promise.all([
    adminDb
      .from('matches')
      .select('id, poule_id, player1_id, player2_id, team1_id, team2_id, status')
      .eq('id', score.match_id)
      .single(),
    supabase.from('match_confirmations').select('id, confirmed_by, action').eq('score_id', scoreId),
  ])

  if (matchError || !match) {
    return NextResponse.json({ error: 'Wedstrijd niet gevonden' }, { status: 404 })
  }

  if (confirmationsError) return NextResponse.json({ error: confirmationsError.message }, { status: 500 })

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
      // poule_players can only be written by admins under RLS (see migration 00001), so this
      // trusted server-side stats/ranking transition must go through the service-role client,
      // just like the `match` lookup above — otherwise these updates silently affect 0 rows
      // whenever a player (not an admin) is the one confirming the score.
      const finalizeResult = await finalizeMatchScore(adminDb, {
        scoreId,
        matchId: match.id,
        pouleId: match.poule_id,
        player1Id: match.player1_id,
        player2Id: match.player2_id,
        winnerId: score.winner_id,
      })
      if (!finalizeResult.success) {
        return NextResponse.json({ error: finalizeResult.error ?? 'Onbekende fout' }, { status: 500 })
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
    const [{ error: scoreUpdateError }, { error: matchUpdateError }] = await Promise.all([
      supabase.from('match_scores').update({ status: 'disputed' }).eq('id', scoreId),
      supabase.from('matches').update({ status: 'disputed' }).eq('id', match.id),
    ])

    if (scoreUpdateError) return NextResponse.json({ error: scoreUpdateError.message }, { status: 500 })
    if (matchUpdateError) return NextResponse.json({ error: matchUpdateError.message }, { status: 500 })

    await sendNotification(
      score.submitted_by,
      'Score betwist',
      'Je tegenstander heeft de ingegeven score betwist en zal een nieuwe score voorstellen.',
      'score_entered',
      `/matches/${match.id}`,
      match.id
    )
  }

  return NextResponse.json({ success: true })
}
