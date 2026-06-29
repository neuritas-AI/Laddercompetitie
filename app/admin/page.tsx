import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, AlertCircle, GitCommitHorizontal, ListOrdered } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Real counts
  const [
    { count: playerCount },
    { count: teamCount },
    { count: pouleCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
    supabase.from('teams').select('*', { count: 'exact', head: true }),
    supabase.from('poules').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'played'), // played but not confirmed
  ])

  // Recent registrations (last 5 players)
  const { data: recentPlayers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url, created_at, is_active')
    .eq('role', 'player')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">Systeemoverzicht</h1>
        <p className="text-gray-500 dark:text-muted-foreground">Real-time KPI's en openstaande taken.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Spelers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{playerCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Actieve spelers in het systeem</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dubbelteams</CardTitle>
            <GitCommitHorizontal className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{teamCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Geregistreerde dubbelteams</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actieve Poules</CardTitle>
            <ListOrdered className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{pouleCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Enkel &amp; Dubbel poules</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm border-l-4 border-l-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Te Beoordelen</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-yellow-600">{pendingCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Scores wachten op bevestiging</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Registrations */}
        <Card className="col-span-1 lg:col-span-3 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Laatste Registraties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPlayers && recentPlayers.length > 0 ? recentPlayers.map((p) => {
                const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email
                const initials = name.slice(0, 2).toUpperCase()
                return (
                  <div key={p.id} className="flex items-center justify-between bg-muted/20 p-3 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black overflow-hidden">
                        {p.avatar_url ? <img src={p.avatar_url} alt={name} className="w-full h-full object-cover" /> : initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{name}</p>
                        <p className="text-xs text-muted-foreground font-medium">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {p.is_active ? 'Actief' : 'Inactief'}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 font-medium">
                        {new Date(p.created_at).toLocaleDateString('nl-BE')}
                      </span>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-sm text-muted-foreground font-medium text-center py-8">Nog geen spelers geregistreerd.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-1 lg:col-span-4 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-primary/5 p-5 rounded-xl border border-primary/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-primary">Poulebeheer</h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">
                      Sleep spelers en teams naar de juiste poule via het poulebeheer scherm.
                    </p>
                  </div>
                  <Link href="/admin/poules">
                    <button className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 whitespace-nowrap shadow-sm">
                      Beheer Poules
                    </button>
                  </Link>
                </div>
                <div className="mt-5 flex gap-6 border-t border-primary/10 pt-4">
                  <div className="text-sm font-medium">
                    <span className="font-black text-xl text-foreground">{pouleCount ?? 0}</span> Poules
                  </div>
                  <div className="text-sm font-medium">
                    <span className="font-black text-xl text-foreground">{playerCount ?? 0}</span> Spelers
                  </div>
                  <div className="text-sm font-medium">
                    <span className="font-black text-xl text-foreground">{teamCount ?? 0}</span> Teams
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
