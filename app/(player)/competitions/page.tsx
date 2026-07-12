import { redirect } from 'next/navigation'
import { createClientWithUser } from '@/utils/supabase/server'
import CompetitionsClient from '@/components/competitions-client'

export default async function CompetitionsPage() {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) return redirect('/login')

  const [
    { data: openCompetitions },
    { data: registrations },
    { data: teamRegistrations },
  ] = await Promise.all([
    supabase
      .from('competitions')
      .select('id, name, type, season_year, start_date, end_date, price, status, max_participants')
      .eq('status', 'open')
      .order('season_year', { ascending: false }),
    supabase
      .from('competition_registrations')
      .select(`
        status,
        competitions (
          id, name, type, season_year, start_date, end_date, price, status
        )
      `)
      .eq('player_id', user.id)
      .neq('status', 'cancelled'),
    supabase
      .from('competition_team_registrations')
      .select(`
        status,
        competitions (
          id, name, type, season_year, start_date, end_date, price, status
        )
      `)
      .neq('status', 'cancelled'),
  ])

  const openCompetitionIds = (openCompetitions ?? []).map(c => c.id)
  const [{ data: singleCounts }, { data: teamCounts }] = openCompetitionIds.length
    ? await Promise.all([
        supabase
          .from('competition_registrations')
          .select('competition_id')
          .in('competition_id', openCompetitionIds)
          .neq('status', 'cancelled'),
        supabase
          .from('competition_team_registrations')
          .select('competition_id')
          .in('competition_id', openCompetitionIds)
          .neq('status', 'cancelled'),
      ])
    : [{ data: [] }, { data: [] }]

  const participantCountMap = new Map<string, number>()
  ;(singleCounts ?? []).forEach((r) => {
    participantCountMap.set(r.competition_id, (participantCountMap.get(r.competition_id) ?? 0) + 1)
  })
  ;(teamCounts ?? []).forEach((r) => {
    participantCountMap.set(r.competition_id, (participantCountMap.get(r.competition_id) ?? 0) + 2)
  })

  const registrationMap = new Map<string, any>()

  ;(registrations ?? []).forEach((r) => {
    if (!r.competitions) return
    const comp = r.competitions as any
    registrationMap.set(comp.id, {
      id: comp.id,
      name: comp.name,
      type: comp.type,
      season_year: comp.season_year,
      start_date: comp.start_date,
      end_date: comp.end_date,
      price: Number(comp.price ?? 0),
      status: comp.status,
      registrationStatus: r.status,
    })
  })

  ;(teamRegistrations ?? []).forEach((r) => {
    if (!r.competitions) return
    const comp = r.competitions as any
    if (!registrationMap.has(comp.id)) {
      registrationMap.set(comp.id, {
        id: comp.id,
        name: comp.name,
        type: comp.type,
        season_year: comp.season_year,
        start_date: comp.start_date,
        end_date: comp.end_date,
        price: Number(comp.price ?? 0),
        status: comp.status,
        registrationStatus: r.status,
      })
    }
  })

  const myRegistrations = Array.from(registrationMap.values())

  const competitions = (openCompetitions ?? []).map(c => ({
    ...c,
    price: Number(c.price ?? 0),
    isFull: c.max_participants != null && (participantCountMap.get(c.id) ?? 0) >= c.max_participants,
  }))

  return (
    <CompetitionsClient
      openCompetitions={competitions}
      myRegistrations={myRegistrations}
    />
  )
}
