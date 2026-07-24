import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { normalizeNotificationLink, type NotificationType } from '@/lib/notifications'
import { finalizeMatchScore } from '@/lib/match-finalization'

// Runs on a schedule (see vercel.json) to auto-confirm any score that has sat
// pending for 24+ hours without the opponent confirming or disputing it. This
// must not depend on either player opening the app — it's a pure background
// job driven by Vercel Cron, using the service-role client throughout since
// there's no logged-in user/session in this context.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const adminDb = createClient(supabaseUrl, serviceRoleKey)

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: staleScores, error } = await adminDb
    .from('match_scores')
    .select('id, match_id, submitted_by, winner_id, created_at')
    .eq('status', 'pending')
    .lte('created_at', cutoff)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let confirmedCount = 0
  const errors: string[] = []

  for (const score of staleScores ?? []) {
    const { data: match, error: matchError } = await adminDb
      .from('matches')
      .select('id, poule_id, player1_id, player2_id, status')
      .eq('id', score.match_id)
      .single()

    // Skip if the match has moved on already (e.g. disputed/resolved between
    // the query above and this iteration, or not in the expected 'played' state).
    if (matchError || !match || match.status !== 'played') continue

    const opponentId = match.player1_id === score.submitted_by ? match.player2_id : match.player1_id

    // Record the automatic approval on the opponent's behalf so the
    // confirmations audit trail stays consistent with manual confirmations.
    const { error: confirmError } = await adminDb.from('match_confirmations').insert({
      score_id: score.id,
      confirmed_by: opponentId,
      action: 'approved',
      note: 'Automatisch bevestigd na 24 uur zonder reactie.',
    })
    if (confirmError) {
      errors.push(`${score.id}: ${confirmError.message}`)
      continue
    }

    const result = await finalizeMatchScore(adminDb, {
      scoreId: score.id,
      matchId: match.id,
      pouleId: match.poule_id,
      player1Id: match.player1_id,
      player2Id: match.player2_id,
      winnerId: score.winner_id,
    })
    if (!result.success) {
      errors.push(`${score.id}: ${result.error ?? 'onbekende fout'}`)
      continue
    }

    confirmedCount++

    await Promise.all([
      sendCronNotification(
        adminDb,
        score.submitted_by,
        'Score automatisch bevestigd',
        'Je tegenstander heeft niet binnen 24 uur gereageerd. De ingegeven score is automatisch bevestigd.',
        'score_confirmed',
        `/matches/${match.id}`
      ),
      sendCronNotification(
        adminDb,
        opponentId,
        'Score automatisch bevestigd',
        'Je hebt niet binnen 24 uur gereageerd op de ingegeven score, dus is deze automatisch bevestigd.',
        'score_confirmed',
        `/matches/${match.id}`
      ),
    ])
  }

  return NextResponse.json({ success: true, confirmed: confirmedCount, errors })
}

async function sendCronNotification(
  adminDb: SupabaseClient,
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  linkUrl: string
) {
  const { data: profile } = await adminDb.from('profiles').select('preferences').eq('id', userId).single()
  const notificationsOptIn = profile?.preferences?.notifications || []

  if (profile?.preferences?.notifications && !notificationsOptIn.includes(type)) {
    return
  }

  await adminDb.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    link_url: normalizeNotificationLink(linkUrl, type),
    is_read: false,
  })
}
