import { createClientWithUser } from '@/utils/supabase/server'
import { sendNotification } from '@/app/actions/notifications'
import { parseBrusselsLocalDateTime, formatDateInBrussels } from '@/lib/brussels'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { matchId, date, time, location, notes } = await request.json()

  const { data: match } = await supabase
    .from('matches')
    .select('id, player1_id, player2_id, period_id')
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: 'Wedstrijd niet gevonden' }, { status: 404 })
  if (match.player1_id !== user.id && match.player2_id !== user.id) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const scheduledDate = parseBrusselsLocalDateTime(date, time)

  if (match.period_id) {
    const { data: period } = await supabase
      .from('competition_periods')
      .select('period_number, start_date, end_date')
      .eq('id', match.period_id)
      .single()

    if (period) {
      const periodStart = parseBrusselsLocalDateTime(period.start_date, '00:00')
      const periodEnd = new Date(parseBrusselsLocalDateTime(period.end_date, '23:59').getTime() + 59_999)

      if (scheduledDate < periodStart || scheduledDate > periodEnd) {
        const startLabel = formatDateInBrussels(periodStart, { day: 'numeric', month: 'long', year: 'numeric' })
        const endLabel = formatDateInBrussels(periodEnd, { day: 'numeric', month: 'long', year: 'numeric' })
        return NextResponse.json(
          { error: `Deze wedstrijd hoort bij periode ${period.period_number} en moet gepland worden tussen ${startLabel} en ${endLabel}.` },
          { status: 400 }
        )
      }
    }
  }

  const { error } = await supabase
    .from('matches')
    .update({
      scheduled_date: scheduledDate.toISOString(),
      location: location || null,
      status: 'scheduled',
    })
    .eq('id', matchId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify opponent
  const opponentId = match.player1_id === user.id ? match.player2_id : match.player1_id
  await sendNotification(
    opponentId,
    'Wedstrijd gepland',
    `Je wedstrijd is gepland op ${date} om ${time}${location ? ' te ' + location : ''}.`,
    'match_scheduled',
    `/matches/${matchId}`,
    matchId
  )

  return NextResponse.json({ success: true })
}
