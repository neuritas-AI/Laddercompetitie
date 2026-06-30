import { createClient } from '@/utils/supabase/server'
import CompetitionsClient from '@/components/competitions-client'

export default async function CompetitionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: openCompetitions } = await supabase
    .from('competitions')
    .select('id, name, type, season_year, start_date, end_date, price, status')
    .eq('status', 'open')
    .order('season_year', { ascending: false })

  const { data: registrations } = await supabase
    .from('competition_registrations')
    .select(`
      status,
      competitions (
        id, name, type, season_year, start_date, end_date, price, status
      )
    `)
    .eq('player_id', user!.id)
    .neq('status', 'cancelled')

  const myRegistrations = (registrations ?? [])
    .filter(r => r.competitions)
    .map(r => {
      const comp = r.competitions as any
      return {
        id: comp.id,
        name: comp.name,
        type: comp.type,
        season_year: comp.season_year,
        start_date: comp.start_date,
        end_date: comp.end_date,
        price: Number(comp.price ?? 0),
        status: comp.status,
        registrationStatus: r.status,
      }
    })

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
