import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Users, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import AddTeamDialog from '@/components/admin/add-team-dialog'

export default async function AdminTeamsPage() {
  const supabase = await createClient()

  // Fetch teams with members
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      created_at,
      team_members(
        player_id,
        profiles(first_name, last_name, avatar_url)
      )
    `)
    .order('created_at', { ascending: false })

  // Fetch players for the team creation dialog
  const { data: players } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('role', 'player')
    .eq('is_active', true)
    .order('first_name')

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dubbelteams</h1>
          <p className="text-muted-foreground">Beheer de dubbelteams en hun samenstelling.</p>
        </div>
        <AddTeamDialog players={players ?? []} />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Alle Teams ({teams?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {teams && teams.length > 0 ? (
            <div className="divide-y divide-border/40">
              {teams.map(team => {
                const members = (team.team_members ?? []) as any[]
                const p1 = members[0]?.profiles
                const p2 = members[1]?.profiles
                const p1Name = p1 ? `${p1.first_name ?? ''} ${p1.last_name ?? ''}`.trim() || 'Onbekend' : '?'
                const p2Name = p2 ? `${p2.first_name ?? ''} ${p2.last_name ?? ''}`.trim() || 'Onbekend' : '?'
                return (
                  <div key={team.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm z-10 flex items-center justify-center font-black text-gray-500">
                          {p1?.avatar_url ? <img src={p1.avatar_url} alt={p1Name} className="w-full h-full object-cover" /> : p1Name.charAt(0)}
                        </div>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 border-2 border-white shadow-sm z-0 flex items-center justify-center font-black text-gray-500">
                          {p2?.avatar_url ? <img src={p2.avatar_url} alt={p2Name} className="w-full h-full object-cover" /> : p2Name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">{team.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">{p1Name} &amp; {p2Name}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-14 h-14 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground text-lg">Nog geen teams aangemaakt</p>
              <p className="text-sm text-muted-foreground/70 mt-1 font-medium">Maak een team aan via de knop hierboven.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
