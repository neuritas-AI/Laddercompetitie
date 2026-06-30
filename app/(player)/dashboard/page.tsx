import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Trophy, ChevronRight, PenSquare, User } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getDisplayName } from '@/lib/profile'
import { REGISTRATION_STATUS_LABELS } from '@/lib/competitions'

export default async function PlayerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, avatar_url')
    .eq('id', user!.id)
    .single()

  const displayName = getDisplayName(profile ?? {})
  const firstName = profile?.first_name?.trim() || displayName.split(' ')[0]

  // Fetch user's competition registrations
  const { data: registrations } = await supabase
    .from('competition_registrations')
    .select(`
      status,
      competitions (id, name, type, season_year, start_date, end_date)
    `)
    .eq('player_id', user!.id)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  // Fetch poule info
  const { data: poulePlayer } = await supabase
    .from('poule_players')
    .select('position, matches_played, matches_won, poules(name, id)')
    .eq('player_id', user!.id)
    .maybeSingle()

  const pouleName = (poulePlayer?.poules as any)?.name ?? null
  const pouleId = (poulePlayer?.poules as any)?.id ?? null
  const position = poulePlayer?.position ?? null

  // Count players in poule to show "X / Y"
  let pouleSize = 0
  if (pouleId) {
    const { count } = await supabase
      .from('poule_players')
      .select('*', { count: 'exact', head: true })
      .eq('poule_id', pouleId)
    pouleSize = count ?? 0
  }

  // Upcoming matches (where I'm player1 or player2 and not yet confirmed)
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select(`
      id,
      scheduled_date,
      location,
      status,
      player1_id,
      player2_id,
      player1:profiles!matches_player1_id_fkey(first_name, last_name, avatar_url),
      player2:profiles!matches_player2_id_fkey(first_name, last_name, avatar_url)
    `)
    .or(`player1_id.eq.${user!.id},player2_id.eq.${user!.id}`)
    .in('status', ['scheduled'])
    .order('scheduled_date', { ascending: true })
    .limit(3)

  // Past/confirmed matches
  const { data: recentMatches } = await supabase
    .from('matches')
    .select(`
      id,
      scheduled_date,
      status,
      score_player1,
      score_player2,
      winner_id,
      player1_id,
      player2_id,
      player1:profiles!matches_player1_id_fkey(first_name, last_name, avatar_url),
      player2:profiles!matches_player2_id_fkey(first_name, last_name, avatar_url)
    `)
    .or(`player1_id.eq.${user!.id},player2_id.eq.${user!.id}`)
    .in('status', ['confirmed', 'played'])
    .order('scheduled_date', { ascending: false })
    .limit(3)


  // Helper to get opponent
  const getOpponent = (match: any) => {
    const isPlayer1 = match.player1_id === user!.id
    return isPlayer1 ? match.player2 : match.player1
  }

  const formatDate = (d: string | null) => {
    if (!d) return null
    return new Date(d).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Welkom terug,</p>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-2">{displayName} 👋</h1>
        </div>
      </div>

      {/* My Competitions */}
      {registrations && registrations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Mijn competities</h2>
            <Link href="/competitions" className="text-xs font-bold text-primary hover:underline">Bekijk alles</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {registrations.map((reg) => {
              const comp = reg.competitions as any
              if (!comp) return null
              const statusLabel = REGISTRATION_STATUS_LABELS[reg.status] ?? reg.status
              return (
                <Card key={comp.id} className="p-4 border border-border/50 shadow-subtle">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{comp.name}</p>
                      <p className="text-xs text-muted-foreground">Seizoen {comp.season_year}</p>
                      <Badge className="mt-2 bg-primary/10 text-primary border-0 text-[10px] font-bold">{statusLabel}</Badge>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Volgende wedstrijd */}
        <div className="relative rounded-[1.5rem] bg-mockup-red text-white p-6 shadow-soft-red overflow-hidden flex flex-col justify-between min-h-[180px]">
          <svg className="absolute -right-6 -top-6 w-48 h-48 text-white/10" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 50 Q50 20 80 50 Q50 80 20 50" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wide mb-3">Volgende wedstrijd</p>
            {upcomingMatches && upcomingMatches.length > 0 ? (() => {
              const next = upcomingMatches[0]
              const opp = getOpponent(next)
              const oppName = opp ? `${opp.first_name || ''} ${opp.last_name || ''}`.trim() || 'Tegenstander' : 'Tegenstander'
              return (
                <>
                  <h3 className="font-black text-xl leading-tight">{firstName}<br/>vs {oppName}</h3>
                  <p className="text-white/90 text-sm font-medium flex items-center gap-1.5 mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {next.scheduled_date ? formatDate(next.scheduled_date) : 'Nog geen datum'}
                  </p>
                </>
              )
            })() : (
              <>
                <h3 className="font-black text-xl leading-tight">Geen wedstrijd<br/>gepland</h3>
                <p className="text-white/80 text-sm mt-2 font-medium">Je hebt momenteel geen geplande wedstrijden.</p>
              </>
            )}
          </div>
          <div className="relative z-10 mt-4">
            <Link href="/matches">
              <Button variant="ghost" className="w-full bg-black/10 hover:bg-black/20 text-white justify-between rounded-xl h-10 px-4 font-bold text-sm">
                Bekijk wedstrijden <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Card 2: Jouw Positie */}
        <div className="rounded-[1.5rem] bg-card border border-border/50 p-6 shadow-soft flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <p className="text-foreground text-sm font-bold">Jouw positie</p>
            <Trophy className="h-10 w-10 text-primary/10" />
          </div>
          <div>
            {position ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black tracking-tighter text-foreground">{position}</span>
                  <span className="text-2xl font-bold text-muted-foreground">/ {pouleSize}</span>
                </div>
                <p className="text-foreground font-semibold mt-2">{pouleName}</p>
              </>
            ) : (
              <p className="text-muted-foreground font-semibold text-sm">Nog niet ingedeeld in een poule.</p>
            )}
          </div>
        </div>

        {/* Card 3: Wedstrijden gespeeld */}
        <div className="rounded-[1.5rem] bg-card border border-border/50 p-6 shadow-soft flex flex-col justify-between min-h-[180px]">
          <p className="text-foreground text-sm font-bold mb-4">Statistieken</p>
          <div className="flex-1 flex flex-col justify-center gap-4">
            <div>
              <p className="text-4xl font-black text-foreground">{poulePlayer?.matches_played ?? 0}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Wedstrijden gespeeld</p>
            </div>
            <div>
              <p className="text-2xl font-black text-green-600">{poulePlayer?.matches_won ?? 0}</p>
              <p className="text-xs text-muted-foreground font-medium">Gewonnen</p>
            </div>
          </div>
        </div>

        {/* Card 4: Score ingeven */}
        <div className="relative rounded-[1.5rem] bg-mockup-dark text-white p-6 shadow-soft overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-1">Geef je score in</h3>
            <p className="text-white/80 text-xs font-medium leading-relaxed max-w-[80%]">
              Vergeet niet om je wedstrijdscore in te geven na het spelen.
            </p>
          </div>
          <div className="relative z-10 mt-4">
            <Link href="/matches">
              <Button className="bg-white hover:bg-white/90 text-primary w-fit h-10 rounded-xl px-5 font-bold text-sm shadow-md">
                Score ingeven
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Aankomende wedstrijden */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-foreground">Aankomende wedstrijden</h2>
            <Link href="/matches" className="text-xs font-bold text-primary hover:underline">Bekijk alles</Link>
          </div>
          
          <div className="bg-card rounded-[1.5rem] border border-border/50 shadow-soft overflow-hidden p-2">
            {upcomingMatches && upcomingMatches.length > 0 ? (
              <div className="divide-y divide-border/40">
                {upcomingMatches.map((match) => {
                  const opp = getOpponent(match)
                  const oppName = opp ? `${opp.first_name || ''} ${opp.last_name || ''}`.trim() || 'Tegenstander' : 'Tegenstander'
                  return (
                    <div key={match.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                        {opp?.avatar_url ? (
                          <img src={opp.avatar_url} alt={oppName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-lg">
                            {oppName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{oppName}</p>
                        <p className="text-xs text-muted-foreground font-medium">{pouleName ?? 'Geen poule'}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground mr-4">
                        <Calendar className="w-3.5 h-3.5" />
                        {match.scheduled_date ? formatDate(match.scheduled_date) : 'Nog geen datum gepland'}
                      </div>
                      <Link href="/matches">
                        <Button className="bg-primary hover:bg-primary/90 text-white text-xs h-8 px-4 rounded-lg font-bold">Bekijk</Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="font-bold text-muted-foreground">Nog geen wedstrijden gepland</p>
                <p className="text-xs text-muted-foreground/70 mt-1 font-medium">Je aankomende wedstrijden verschijnen hier.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Snelle acties */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Snelle acties</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/matches" className="bg-card border border-border/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors shadow-subtle group">
                <Calendar className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[9px] text-center font-bold leading-tight">Plan een<br/>datum</span>
              </Link>
              <Link href="/matches" className="bg-card border border-border/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors shadow-subtle group">
                <PenSquare className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[9px] text-center font-bold leading-tight">Score<br/>ingeven</span>
              </Link>
              <Link href="/competitions" className="bg-card border border-border/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors shadow-subtle group">
                <Trophy className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[9px] text-center font-bold leading-tight">Competitie<br/>inschrijven</span>
              </Link>
              <Link href="/profile" className="bg-card border border-border/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors shadow-subtle group">
                <User className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[9px] text-center font-bold leading-tight mt-1">Profiel</span>
              </Link>
            </div>
          </div>

          {/* Positie Banner */}
          {position && (
            <div className="relative bg-mockup-red rounded-[1.5rem] p-6 text-white shadow-soft-red overflow-hidden flex items-center justify-between">
              <div className="relative z-10">
                <p className="text-white/80 text-xs font-bold mb-1">Jouw positie</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black tracking-tighter">{position}</span>
                  <span className="text-2xl font-bold text-white/60">/ {pouleSize}</span>
                </div>
                <p className="text-sm font-semibold mt-1">{pouleName}</p>
              </div>
              <Trophy className="relative z-10 w-16 h-16 text-white/20" />
            </div>
          )}

          {/* Laatste wedstrijden */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Laatste wedstrijden</h2>
              <Link href="/matches" className="text-xs font-bold text-primary hover:underline">Bekijk alles</Link>
            </div>
            <div className="bg-card rounded-[1.5rem] border border-border/50 p-4 shadow-subtle">
              {recentMatches && recentMatches.length > 0 ? (
                <div className="space-y-4">
                  {recentMatches.map((match) => {
                    const opp = getOpponent(match)
                    const oppName = opp ? `${opp.first_name || ''} ${opp.last_name || ''}`.trim() || 'Tegenstander' : 'Tegenstander'
                    const isPlayer1 = match.player1_id === user!.id
                    const myScore = isPlayer1 ? match.score_player1 : match.score_player2
                    const oppScore = isPlayer1 ? match.score_player2 : match.score_player1
                    const won = match.winner_id === user!.id
                    return (
                      <div key={match.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                          {opp?.avatar_url ? (
                            <img src={opp.avatar_url} alt={oppName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">{oppName.charAt(0)}</div>
                          )}
                        </div>
                        <p className="text-sm font-bold flex-1 truncate">{oppName}</p>
                        {myScore && oppScore && (
                          <span className="text-xs font-black">{myScore} – {oppScore}</span>
                        )}
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase hidden sm:inline-block ${won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {won ? 'Winst' : 'Verlies'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-medium text-center py-6">Nog geen gespeelde wedstrijden.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
