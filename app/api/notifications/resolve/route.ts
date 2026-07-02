import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { notificationId } = await request.json()
  if (!notificationId) return NextResponse.json({ error: 'Geen notificationId' }, { status: 400 })

  const { data: notif } = await supabase.from('notifications').select('id, type, link_url, created_at').eq('id', notificationId).maybeSingle()
  if (!notif) return NextResponse.json({ error: 'Notificatie niet gevonden' }, { status: 404 })

  if (notif.link_url && notif.link_url.startsWith('/')) {
    return NextResponse.json({ success: true, url: notif.link_url })
  }

  if (notif.type === 'score_entered') {
    const { data: score } = await supabase
      .from('match_scores')
      .select('match_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (score?.match_id) return NextResponse.json({ success: true, url: `/matches/${score.match_id}/confirm` })
  }

  if (notif.type === 'match_scheduled' || notif.type === 'match_today' || notif.type === 'match_tomorrow' || notif.type === 'score_confirmed') {
    const { data: match } = await supabase
      .from('matches')
      .select('id, scheduled_date')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (match?.id) return NextResponse.json({ success: true, url: `/matches/${match.id}` })
  }

  // Fallback: send user to matches list
  return NextResponse.json({ success: true, url: '/matches' })
}
