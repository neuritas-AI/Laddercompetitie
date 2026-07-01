import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings2, GripVertical } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import AddPouleDialog from '@/components/admin/add-poule-dialog'
import GeneratePoulesDialog from '@/components/admin/generate-poules-dialog'
import { PouleActions } from '@/components/admin/poule-actions'
import MovePlayerDialog from '@/components/admin/move-player-dialog'

export default async function AdminPoulesPage() {
  const supabase = await createClient()

  // Fetch poules with their players
  const { data: poules } = await supabase
    .from('poules')
    .select(`
      id,
      name,
      level,
      competition_id,
      competitions(name, type),
      poule_players(
        position,
        player_id,
        profiles(first_name, last_name, avatar_url)
      ),
      team_poules(id)
    `)
    .order('level', { ascending: true })

  // Fetch competitions for the add poule dialog
  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Poulebeheer</h1>
          <p className="text-muted-foreground">Overzicht van alle poules en hun spelers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GeneratePoulesDialog competitions={competitions ?? []} />
          <AddPouleDialog competitions={competitions ?? []} />
        </div>
      </div>

      {poules && poules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {poules.map((poule) => {
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
                          <MovePlayerDialog player={{ id: pp.player_id, name }} poules={(poules ?? []).filter((item: any) => item.id !== poule.id)} currentPouleId={poule.id} />
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
          <p className="font-bold text-muted-foreground text-lg">Nog geen poules aangemaakt</p>
          <p className="text-sm text-muted-foreground/70 mt-1 font-medium">Maak eerst een competitie en poule aan via de knop hierboven.</p>
        </div>
      )}
    </div>
  )
}
