import { createClient } from '@/utils/supabase/server'
import MatchesClient from '@/components/matches-client'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get poule info
  const { data: poulePlayer } = await supabase
    .from('poule_players')
    .select('poule_id, poules(name)')
    .eq('player_id', user!.id)
    .maybeSingle()

  const pouleName = (poulePlayer?.poules as any)?.name ?? null

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
    player1:profiles!matches_player1_id_fkey(first_name, last_name, avatar_url),
    player2:profiles!matches_player2_id_fkey(first_name, last_name, avatar_url),
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
    .in('status', ['confirmed', 'played'])
    .order('scheduled_date', { ascending: false })

  return (
    <MatchesClient
      upcoming={(upcoming ?? []) as any}
      past={(past ?? []) as any}
      userId={user!.id}
      pouleName={pouleName}
    />
  )
}
