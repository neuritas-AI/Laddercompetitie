import { createClientWithUser } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  // Fetch matches with status 'played' where the user is a participant
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
      match_scores(id, p1_score, p2_score, submitted_by, status)
    `)
    .eq('status', 'played')
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter matches to those that have a pending score submitted by the opponent
  const filtered = (matches ?? []).filter((m: any) => {
    if (!m.match_scores || m.match_scores.length === 0) return false
    const pending = m.match_scores.find((s: any) => s.status === 'pending')
    if (!pending) return false
    return pending.submitted_by !== user.id
  }).map((m: any) => ({
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
  }))

  return NextResponse.json({ matches: filtered })
}
