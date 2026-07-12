import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings2, GripVertical, ListOrdered } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import AddPouleDialog from '@/components/admin/add-poule-dialog'
import GeneratePoulesDialog from '@/components/admin/generate-poules-dialog'
import { PouleActions } from '@/components/admin/poule-actions'
import MovePlayerDialog from '@/components/admin/move-player-dialog'
import RemovePlayerFromPouleButton from '@/components/admin/remove-player-from-poule-button'
import CompetitionFilter from '@/components/admin/competition-filter'

export default async function AdminPoulesPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>
}) {
  const supabase = await createClient()
  const { competition: competitionFilter } = await searchParams

  // Fetch poules with their players
  const { data: poules } = await supabase
    .from('poules')
    .select(`
      id,
      name,
      level,
      competition_id,
      is_active,
      competitions(name, type),
      poule_players(
        position,
        matches_won,
        player_id,
        profiles(first_name, last_name, avatar_url)
      ),
      team_poules(
        position,
        matches_won,
        team_id,
        teams(name)
      )
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

  // Flatten every poule's individual and team standings into one ranking list.
  // Points: a win is worth 2, a loss 0 (same rule as the player-facing ranking).
  const rankingRows = filteredPoules.flatMap((poule) => {
    const competitionName = (poule.competitions as any)?.name ?? 'Geen competitie'
    const playerRows = ((poule.poule_players ?? []) as any[]).map((pp) => ({
      key: `pp-${poule.id}-${pp.player_id}`,
      position: pp.position,
      name: pp.profiles ? `${pp.profiles.first_name ?? ''} ${pp.profiles.last_name ?? ''}`.trim() || 'Onbekend' : 'Onbekend',
      points: (pp.matches_won ?? 0) * 2,
      pouleName: poule.name,
      competitionName,
    }))
    const teamRows = ((poule.team_poules ?? []) as any[]).map((tp) => ({
      key: `tp-${poule.id}-${tp.team_id}`,
      position: tp.position,
      name: tp.teams?.name ?? 'Onbekend team',
      points: (tp.matches_won ?? 0) * 2,
      pouleName: poule.name,
      competitionName,
    }))
    return [...playerRows, ...teamRows].sort((a, b) => a.position - b.position)
  })

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

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            Rangschikking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {rankingRows.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                  <th className="px-5 py-3 font-bold">Positie</th>
                  <th className="px-5 py-3 font-bold">Speler / Team</th>
                  <th className="px-5 py-3 font-bold">Punten</th>
                  <th className="px-5 py-3 font-bold">Poule</th>
                  <th className="px-5 py-3 font-bold">Competitie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rankingRows.map((row) => (
                  <tr key={row.key} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {row.position}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-foreground">{row.name}</td>
                    <td className="px-5 py-3 font-black text-foreground">{row.points}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.pouleName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.competitionName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ListOrdered className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground">Nog geen rangschikking beschikbaar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredPoules && filteredPoules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPoules.map((poule) => {
            const players = ((poule.poule_players ?? []) as any[]).sort((a, b) => a.position - b.position)
            const competition = (poule.competitions as any)?.name ?? 'Geen competitie'
            return (
              <Card key={poule.id} className="border-0 shadow-sm flex flex-col">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold">{poule.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{competition}</p>
                    </div>
                    <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-full">{players.length} Spelers</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-4 bg-gray-50/50 dark:bg-background/50">
                  <div className="space-y-2 min-h-[100px]">
                    {players.length > 0 ? players.map((pp: any) => {
                      const p = pp.profiles
                      const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Onbekend' : 'Onbekend'
                      return (
                        <div key={pp.player_id} className="flex items-center gap-3 bg-white dark:bg-card p-3 rounded-lg border shadow-sm">
                          <div className="cursor-grab text-muted-foreground">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                            {pp.position}
                          </div>
                          <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden shrink-0">
                            {p?.avatar_url
                              ? <img src={p.avatar_url} alt={name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">{name.charAt(0)}</div>
                            }
                          </div>
                          <div className="font-semibold text-sm flex-1 truncate">{name}</div>
                          <div className="flex items-center gap-2">
                            <MovePlayerDialog player={{ id: pp.player_id, name }} poules={(poules ?? []).filter((item: any) => item.id !== poule.id)} currentPouleId={poule.id} />
                            <RemovePlayerFromPouleButton playerId={pp.player_id} pouleId={poule.id} />
                          </div>
                        </div>
                      )
                    }) : (
                      <p className="text-sm text-muted-foreground font-medium text-center py-8">Geen spelers in deze poule</p>
                    )}
                  </div>
                </CardContent>
                <div className="border-t border-border/50 p-4 bg-muted/10">
                  <PouleActions poule={poule} competitions={competitions ?? []} poules={poules ?? []} />
                </div>
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
