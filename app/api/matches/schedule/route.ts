import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { matchId, date, time, location, notes } = await request.json()

  const { data: match } = await supabase
    .from('matches')
    .select('id, player1_id, player2_id')
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: 'Wedstrijd niet gevonden' }, { status: 404 })
  if (match.player1_id !== user.id && match.player2_id !== user.id) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const scheduledDate = new Date(`${date}T${time}`)

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
  await supabase.from('notifications').insert({
    user_id: opponentId,
    title: 'Wedstrijd gepland',
    message: `Je wedstrijd is gepland op ${date} om ${time}${location ? ' te ' + location : ''}.`,
    type: 'match_scheduled',
    link_url: `/matches/${matchId}`,
  })

  return NextResponse.json({ success: true })
}
