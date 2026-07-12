import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarClock, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import CompetitionFilter from '@/components/admin/competition-filter'

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Gepland', color: 'bg-blue-100 text-blue-800' },
  played: { label: 'Wacht op bevestiging', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Bevestigd', color: 'bg-green-100 text-green-800' },
  disputed: { label: 'Betwist', color: 'bg-red-100 text-red-800' },
}

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>
}) {
  const supabase = await createClient()
  const { competition: competitionFilter } = await searchParams

  const [{ data: competitions }, poulesResult] = await Promise.all([
    supabase.from('competitions').select('id, name').eq('is_active', true).order('name'),
    competitionFilter
      ? supabase.from('poules').select('id').eq('competition_id', competitionFilter)
      : Promise.resolve({ data: null }),
  ])

  // Matches don't reference a competition directly (only via their poule), so
  // resolve the poule ids for the selected competition first and scope the
  // match query to those.
  const pouleIdsForCompetition = poulesResult.data?.map((p) => p.id) ?? null

  let matchesQuery = supabase
    .from('matches')
    .select(`
      id,
      scheduled_date,
      location,
      status,
      score_player1,
      score_player2,
      deadline,
      player1:profiles!matches_player1_id_fkey(first_name, last_name),
      player2:profiles!matches_player2_id_fkey(first_name, last_name),
      poule:poules(name)
    `)
    .order('scheduled_date', { ascending: false })
    .limit(50)

  if (pouleIdsForCompetition) {
    matchesQuery = matchesQuery.in('poule_id', pouleIdsForCompetition.length > 0 ? pouleIdsForCompetition : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data: matches } = await matchesQuery

  const formatDate = (d: string | null) => {
    if (!d) return '–'
    return new Date(d).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Wedstrijdbeheer</h1>
        <p className="text-muted-foreground">Overzicht van alle geplande en gespeelde wedstrijden.</p>
      </div>

      <CompetitionFilter competitions={competitions ?? []} selected={competitionFilter ?? ''} />

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Alle Wedstrijden ({matches?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {matches && matches.length > 0 ? (
            <div className="divide-y divide-border/40">
              {matches.map((match) => {
                const p1 = match.player1 as any
                const p2 = match.player2 as any
                const poule = match.poule as any
                const p1Name = p1 ? `${p1.first_name ?? ''} ${p1.last_name ?? ''}`.trim() : '?'
                const p2Name = p2 ? `${p2.first_name ?? ''} ${p2.last_name ?? ''}`.trim() : '?'
                const st = statusConfig[match.status] ?? { label: match.status, color: 'bg-gray-100 text-gray-700' }
                return (
                  <div key={match.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">
                        {p1Name} <span className="text-muted-foreground font-normal">vs</span> {p2Name}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground font-medium">
                        {poule?.name && <span>{poule.name}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(match.scheduled_date)}
                        </span>
                        {match.location && <span className="text-muted-foreground">{match.location}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {match.score_player1 && match.score_player2 && (
                        <span className="font-black text-sm text-foreground">
                          {match.score_player1} – {match.score_player2}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <CalendarClock className="w-14 h-14 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground text-lg">
                {competitionFilter ? 'Geen wedstrijden voor deze competitie' : 'Nog geen wedstrijden aangemaakt'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1 font-medium">
                {competitionFilter ? 'Kies een andere competitie hierboven.' : 'Wedstrijden worden aangemaakt vanuit poule-beheer.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
