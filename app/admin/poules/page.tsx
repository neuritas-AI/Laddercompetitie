import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings2, Users, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import AddPouleDialog from '@/components/admin/add-poule-dialog'
import GeneratePoulesDialog from '@/components/admin/generate-poules-dialog'
import { PouleActions } from '@/components/admin/poule-actions'
import CompetitionFilter from '@/components/admin/competition-filter'

export default async function AdminPoulesPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>
}) {
  const supabase = await createClient()
  const { competition: competitionFilter } = await searchParams

  // Fetch poules with just enough to summarize each one — the full player/team
  // list and ranking live on the poule's own detail page, not stacked here.
  const { data: poules } = await supabase
    .from('poules')
    .select(`
      id,
      name,
      level,
      competition_id,
      is_active,
      competitions(name, type),
      poule_players(player_id),
      team_poules(team_id)
    `)
    .eq('is_active', true)
    .order('level', { ascending: true })

  // Fetch competitions for the filter and the add poule dialog
  const [{ data: competitions }, { data: players }] = await Promise.all([
    supabase
      .from('competitions')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('is_active', true)
      .neq('role', 'admin')
      .order('first_name'),
  ])

  const filteredPoules = competitionFilter
    ? (poules ?? []).filter((p) => p.competition_id === competitionFilter)
    : (poules ?? [])

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Poulebeheer</h1>
          <p className="text-muted-foreground">Overzicht van alle poules en hun spelers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GeneratePoulesDialog competitions={competitions ?? []} />
          <AddPouleDialog competitions={competitions ?? []} players={(players ?? []) as any} />
        </div>
      </div>

      <CompetitionFilter competitions={competitions ?? []} selected={competitionFilter ?? ''} />

      {filteredPoules && filteredPoules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPoules.map((poule) => {
            const playerCount = ((poule.poule_players ?? []) as any[]).length
            const teamCount = ((poule.team_poules ?? []) as any[]).length
            const memberCount = playerCount + teamCount
            const competition = (poule.competitions as any)?.name ?? 'Geen competitie'
            return (
              <Card key={poule.id} className="border-0 shadow-sm flex flex-col">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                  <div className="flex justify-between items-start gap-2">
                    <Link href={`/admin/poules/${poule.id}`} className="min-w-0 group">
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors truncate">{poule.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{competition} · Niveau {poule.level}</p>
                    </Link>
                    <PouleActions poule={poule} competitions={competitions ?? []} poules={poules ?? []} />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-4 bg-gray-50/50 dark:bg-background/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Users className="w-4 h-4" />
                    {memberCount > 0 ? `${memberCount} ${teamCount > 0 ? 'teams/spelers' : 'spelers'}` : 'Nog niemand toegewezen'}
                  </div>
                </CardContent>
                <Link
                  href={`/admin/poules/${poule.id}`}
                  className="flex items-center justify-between border-t border-border/50 p-4 bg-muted/10 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                >
                  Bekijk rangschikking
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-[1.5rem] border border-border/50">
          <Settings2 className="w-14 h-14 text-muted-foreground/30 mb-4" />
          <p className="font-bold text-muted-foreground text-lg">
            {competitionFilter ? 'Geen poules voor deze competitie' : 'Nog geen poules aangemaakt'}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1 font-medium">
            {competitionFilter
              ? 'Kies een andere competitie of maak hier een nieuwe poule aan.'
              : 'Maak eerst een competitie en poule aan via de knop hierboven.'}
          </p>
        </div>
      )}
    </div>
  )
}
