import { redirect } from 'next/navigation'
import { createClientWithUser } from '@/utils/supabase/server'
import { getCachedPoulePlayer } from '@/lib/server-data'
import MatchesClient from '@/components/matches-client'

export default async function MatchesPage() {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) return redirect('/login')

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

  const [
    poulePlayer,
    { data: registrations },
    { data: teamRegistrations },
    { data: upcoming },
    { data: past },
  ] = await Promise.all([
    getCachedPoulePlayer(user.id),
    supabase
      .from('competition_registrations')
      .select('id')
      .eq('player_id', user.id)
      .neq('status', 'cancelled')
      .limit(1),
    supabase
      .from('competition_team_registrations')
      .select('id')
      .limit(1),
    // Upcoming matches
    supabase
      .from('matches')
      .select(matchSelect)
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .in('status', ['scheduled'])
      .order('scheduled_date', { ascending: true }),
    // Past/confirmed matches
    supabase
      .from('matches')
      .select(matchSelect)
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .in('status', ['confirmed', 'played', 'disputed'])
      .order('scheduled_date', { ascending: false }),
  ])

  const pouleName = (poulePlayer?.poules as any)?.name ?? null
  const hasCompetition = (registrations?.length ?? 0) > 0 || (teamRegistrations?.length ?? 0) > 0

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
