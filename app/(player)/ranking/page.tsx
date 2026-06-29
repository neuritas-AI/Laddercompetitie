import { Trophy, Shield, Info } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get current user's poule
  const { data: myPoulePlayer } = await supabase
    .from('poule_players')
    .select('poule_id, position, poules(name)')
    .eq('player_id', user!.id)
    .maybeSingle()

  const myPouleId = myPoulePlayer?.poule_id ?? null
  const myPouleLabel = (myPoulePlayer?.poules as any)?.name ?? null
  const myPosition = myPoulePlayer?.position ?? null

  // Fetch all players in same poule
  let rankedPlayers: any[] = []
  let pouleSize = 0

  if (myPouleId) {
    const { data: playersInPoule, count } = await supabase
      .from('poule_players')
      .select('position, player_id, profiles(first_name, last_name, avatar_url)', { count: 'exact' })
      .eq('poule_id', myPouleId)
      .order('position', { ascending: true })

    rankedPlayers = playersInPoule ?? []
    pouleSize = count ?? 0
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Rangschikking</h1>
      </div>

      {/* Jouw Positie Banner */}
      <div className="relative bg-mockup-red rounded-[1.5rem] p-8 md:p-10 text-white shadow-soft-red overflow-hidden flex items-center justify-between">
        <div className="relative z-10">
          <p className="text-white/80 text-sm font-bold mb-2 uppercase tracking-wider">Jouw positie</p>
          {myPosition ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black tracking-tighter">{myPosition}</span>
                <span className="text-3xl font-bold text-white/60">/ {pouleSize}</span>
              </div>
              <p className="text-lg font-semibold mt-2">{myPouleLabel}</p>
            </>
          ) : (
            <p className="text-xl font-bold mt-2 text-white/80">Nog niet ingedeeld in een poule</p>
          )}
        </div>
        <Trophy className="relative z-10 w-24 h-24 text-white/20" />
        <svg className="absolute left-[60%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-black/10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M50 80 C20 80 10 50 10 30 C30 30 40 50 50 80" />
          <path d="M50 80 C80 80 90 50 90 30 C70 30 60 50 50 80" />
        </svg>
      </div>

      <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-[1.5rem] border border-blue-100 flex items-start gap-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full shrink-0 mt-0.5">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-blue-900 dark:text-blue-100">Privacy Modus Actief</h3>
          <p className="text-sm text-blue-800/80 dark:text-blue-200/80 mt-1 font-medium leading-relaxed">
            Voor eerlijke competitie tonen we enkel de positie in de poule.
            Gedetailleerde wedstrijdstatistieken en punten zijn onzichtbaar.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-[1.5rem] border border-border/50 shadow-soft overflow-hidden p-2">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2 text-muted-foreground font-bold text-sm">
          <Trophy className="w-4 h-4 text-primary" />
          {myPouleLabel ? `Huidige stand – ${myPouleLabel}` : 'Huidige Stand'}
        </div>
        <div className="divide-y divide-border/40">
          {rankedPlayers.length > 0 ? rankedPlayers.map((pp) => {
            const profile = pp.profiles as any
            const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Onbekend' : 'Onbekend'
            const isMe = pp.player_id === user!.id
            return (
              <div
                key={pp.player_id}
                className={`flex items-center gap-6 p-4 rounded-xl transition-colors ${isMe ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-black text-xl shrink-0 shadow-sm ${
                  pp.position === 1 ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' :
                  pp.position === 2 ? 'bg-slate-100 text-slate-700 border-2 border-slate-200' :
                  pp.position === 3 ? 'bg-orange-100 text-orange-800 border-2 border-orange-200' :
                  isMe ? 'bg-primary text-white shadow-soft-red' :
                  'bg-muted/50 text-muted-foreground'
                }`}>
                  {pp.position}
                </div>
                
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 shadow-inner">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{name.charAt(0)}</div>
                    )}
                  </div>
                  <p className={`font-bold text-lg truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                    {name}
                    {isMe && <span className="ml-3 text-[10px] uppercase tracking-widest font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">Jij</span>}
                  </p>
                </div>
              </div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground">Nog geen ranking beschikbaar</p>
              <p className="text-xs text-muted-foreground/70 mt-1 font-medium">Je wordt aan een poule toegewezen door een beheerder.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center">
        <p className="text-xs text-muted-foreground/60 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> 
          Posities updaten direct na goedkeuring van een wedstrijd
        </p>
      </div>
    </div>
  )
}
