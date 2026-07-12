import Link from 'next/link'
import { ArrowLeft, ListOrdered, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/server'
import { PouleActions } from '@/components/admin/poule-actions'
import MovePlayerDialog from '@/components/admin/move-player-dialog'
import RemovePlayerFromPouleButton from '@/components/admin/remove-player-from-poule-button'

export default async function AdminPouleDetailPage({
  params,
}: {
  params: Promise<{ pouleId: string }>
}) {
  const { pouleId } = await params
  const supabase = await createClient()

  const [{ data: poule }, { data: allPoules }, { data: competitions }] = await Promise.all([
    supabase
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
          matches_played,
          matches_won,
          matches_lost,
          player_id,
          profiles(first_name, last_name, avatar_url)
        ),
        team_poules(
          position,
          matches_played,
          matches_won,
          matches_lost,
          team_id,
          teams(name)
        )
      `)
      .eq('id', pouleId)
      .maybeSingle(),
    supabase.from('poules').select('id, name').eq('is_active', true).order('level'),
    supabase.from('competitions').select('id, name').eq('is_active', true).order('name'),
  ])

  if (!poule) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/admin/poules" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Terug naar poulebeheer
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-[1.5rem] border border-border/50">
          <p className="font-bold text-muted-foreground text-lg">Poule niet gevonden</p>
        </div>
      </div>
    )
  }

  const competitionName = (poule.competitions as any)?.name ?? 'Geen competitie'

  const playerRows = ((poule.poule_players ?? []) as any[]).map((pp) => ({
    key: `pp-${pp.player_id}`,
    kind: 'player' as const,
    playerId: pp.player_id as string,
    position: pp.position,
    name: pp.profiles ? `${pp.profiles.first_name ?? ''} ${pp.profiles.last_name ?? ''}`.trim() || 'Onbekend' : 'Onbekend',
    avatarUrl: pp.profiles?.avatar_url ?? null,
    played: pp.matches_played ?? 0,
    won: pp.matches_won ?? 0,
    lost: pp.matches_lost ?? 0,
    points: (pp.matches_won ?? 0) * 2,
  }))
  const teamRows = ((poule.team_poules ?? []) as any[]).map((tp) => ({
    key: `tp-${tp.team_id}`,
    kind: 'team' as const,
    playerId: null as string | null,
    position: tp.position,
    name: tp.teams?.name ?? 'Onbekend team',
    avatarUrl: null as string | null,
    played: tp.matches_played ?? 0,
    won: tp.matches_won ?? 0,
    lost: tp.matches_lost ?? 0,
    points: (tp.matches_won ?? 0) * 2,
  }))
  const rows = [...playerRows, ...teamRows].sort((a, b) => a.position - b.position)

  const destinationPoules = (allPoules ?? []).filter((p) => p.id !== poule.id)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <Link href="/admin/poules" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Terug naar poulebeheer
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Trophy className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{poule.name}</h1>
            <p className="text-muted-foreground">{competitionName} · Niveau {poule.level}</p>
          </div>
        </div>
        <PouleActions poule={poule} competitions={competitions ?? []} poules={allPoules ?? []} />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            Rangschikking ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {rows.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                  <th className="px-5 py-3 font-bold">Positie</th>
                  <th className="px-5 py-3 font-bold">Speler / Team</th>
                  <th className="px-5 py-3 font-bold">Gespeeld</th>
                  <th className="px-5 py-3 font-bold">W-V</th>
                  <th className="px-5 py-3 font-bold">Punten</th>
                  <th className="px-5 py-3 font-bold text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.map((row) => (
                  <tr key={row.key} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {row.position}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {row.kind === 'player' && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                            {row.avatarUrl
                              ? <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">{row.name.charAt(0)}</div>
                            }
                          </div>
                        )}
                        <span className="font-semibold text-foreground">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{row.played}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.won}-{row.lost}</td>
                    <td className="px-5 py-3 font-black text-foreground">{row.points}</td>
                    <td className="px-5 py-3">
                      {row.kind === 'player' && row.playerId && (
                        <div className="flex items-center justify-end gap-2">
                          <MovePlayerDialog player={{ id: row.playerId, name: row.name }} poules={destinationPoules} currentPouleId={poule.id} />
                          <RemovePlayerFromPouleButton playerId={row.playerId} pouleId={poule.id} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ListOrdered className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground">Geen spelers of teams in deze poule</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
