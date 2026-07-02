import { redirect } from 'next/navigation'
import { createClientWithUser } from '@/utils/supabase/server'
import MatchesClient from '@/components/matches-client'

export default async function MatchesPage() {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) return redirect('/login')

  // Get poule info
  const { data: poulePlayer } = await supabase
    .from('poule_players')
    .select('poule_id, poules(name)')
    .eq('player_id', user!.id)
    .maybeSingle()

  const pouleName = (poulePlayer?.poules as any)?.name ?? null

  const { data: registrations } = await supabase
    .from('competition_registrations')
    .select('id')
    .eq('player_id', user!.id)
    .neq('status', 'cancelled')
    .limit(1)

  const { data: teamRegistrations } = await supabase
    .from('competition_team_registrations')
    .select('id')
    .limit(1)

  const hasCompetition = (registrations?.length ?? 0) > 0 || (teamRegistrations?.length ?? 0) > 0

  const matchSelect = `
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
    poule:poules(name)
  `

  // Upcoming matches
  const { data: upcoming } = await supabase
    .from('matches')
    .select(matchSelect)
    .or(`player1_id.eq.${user!.id},player2_id.eq.${user!.id}`)
    .in('status', ['scheduled'])
    .order('scheduled_date', { ascending: true })

  // Past/confirmed matches
  const { data: past } = await supabase
    .from('matches')
    .select(matchSelect)
    .or(`player1_id.eq.${user!.id},player2_id.eq.${user!.id}`)
    .in('status', ['confirmed', 'played', 'disputed'])
    .order('scheduled_date', { ascending: false })

  return (
    <MatchesClient
      upcoming={(upcoming ?? []) as any}
      past={(past ?? []) as any}
      userId={user!.id}
      pouleName={pouleName}
      hasCompetition={hasCompetition}
    />
  )
}
