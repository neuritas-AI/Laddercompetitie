import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ban, CheckCircle, Shield } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import AddPlayerDialog from '@/components/admin/add-player-dialog'
import { PlayerActions } from '@/components/admin/player-actions'

export default async function AdminPlayersPage() {
  const supabase = await createClient()

  const { data: players } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, is_active, avatar_url, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Spelers & Betalingen</h1>
          <p className="text-muted-foreground">Beheer accounts, profielfoto's en betalingsstatussen.</p>
        </div>
        <AddPlayerDialog />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Gebruikerslijst ({players?.length ?? 0})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {players && players.length > 0 ? (
            <div className="divide-y divide-border/40">
              {players.map(player => {
                const name = [player.first_name, player.last_name].filter(Boolean).join(' ') || player.email
                const initials = name.slice(0, 2).toUpperCase()
                return (
                  <div key={player.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center font-black text-gray-500">
                        {player.avatar_url
                          ? <img src={player.avatar_url} alt={name} className="w-full h-full object-cover" />
                          : initials
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{name}</p>
                          {player.role === 'admin' && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Admin</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{player.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-4 w-full sm:w-auto">
                      <div className="flex flex-col gap-1 min-w-[100px]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status</span>
                        {player.is_active
                          ? <span className="flex items-center gap-1.5 text-xs font-bold text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Actief</span>
                          : <span className="flex items-center gap-1.5 text-xs font-bold text-red-600"><Ban className="w-3.5 h-3.5" /> Inactief</span>
                        }
                      </div>
                      <div className="flex flex-col gap-1 min-w-[100px]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Lid sinds</span>
                        <span className="text-xs font-semibold text-foreground">
                          {new Date(player.created_at).toLocaleDateString('nl-BE')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto sm:ml-0">
                        <PlayerActions playerId={player.id} playerName={name} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Shield className="w-14 h-14 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground text-lg">Nog geen spelers geregistreerd</p>
              <p className="text-sm text-muted-foreground/70 mt-1 font-medium">Spelers verschijnen hier na registratie.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
