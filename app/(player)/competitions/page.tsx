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
      .select('id, name, type, season_year, start_date, end_date, price, status')
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
  }))

  return (
    <CompetitionsClient
      openCompetitions={competitions}
      myRegistrations={myRegistrations}
    />
  )
}
