import Link from 'next/link'
import { ArrowLeft, Phone, Trophy } from 'lucide-react'
import { createClientWithUser } from '@/utils/supabase/server'
import { getDisplayName, getInitials } from '@/lib/profile'
import { REGISTRATION_STATUS_LABELS } from '@/lib/competitions'

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>
}) {
  const { playerId } = await params
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <p className="text-muted-foreground">Niet ingelogd</p>
      </div>
    )
  }

  // Only the fields a player is ever allowed to see about someone else: no
  // email, no ranking/points — those stay admin-only or player-only-for-self.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, phone, share_phone')
    .eq('id', playerId)
    .maybeSingle()

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="rounded-[2rem] border border-border/50 bg-card p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Speler niet gevonden</h1>
        </div>
      </div>
    )
  }

  const [{ data: registrations }, { data: teamMemberships }] = await Promise.all([
    supabase
      .from('competition_registrations')
      .select('status, competitions(id, name, type, season_year, status)')
      .eq('player_id', playerId)
      .neq('status', 'cancelled'),
    supabase
      .from('team_members')
      .select('team_id')
      .eq('player_id', playerId),
  ])

  const teamIds = (teamMemberships ?? []).map((t) => t.team_id)
  const { data: teamRegistrations } = teamIds.length
    ? await supabase
        .from('competition_team_registrations')
        .select('status, competitions(id, name, type, season_year, status)')
        .in('team_id', teamIds)
        .neq('status', 'cancelled')
    : { data: [] }

  const typeLabels: Record<string, string> = {
    single_winter: 'Enkel Winter',
    single_summer: 'Enkel Zomer',
    double_winter: 'Dubbel Winter',
    double_summer: 'Dubbel Zomer',
  }

  const competitionEntries = [
    ...(registrations ?? []).map((r) => ({ competition: r.competitions as any })),
    ...(teamRegistrations ?? []).map((r) => ({ competition: r.competitions as any })),
  ].filter((entry) => entry.competition)

  const displayName = getDisplayName(profile)
  const initials = getInitials(profile)

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <Link href="/matches" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Terug
      </Link>

      <div className="bg-card rounded-[2rem] border border-border/50 shadow-soft overflow-hidden">
        <div className="bg-mockup-red px-6 py-10 flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white/20 flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">{initials}</span>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">{displayName}</h1>
          {profile.share_phone && profile.phone && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white/90">
              <Phone className="w-4 h-4" /> {profile.phone}
            </p>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Trophy className="w-4 h-4 text-primary" />
            Ingeschreven competities
          </div>
          {competitionEntries.length > 0 ? (
            <div className="space-y-2">
              {competitionEntries.map(({ competition }, index) => (
                <div key={`${competition.id}-${index}`} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{competition.name}</p>
                    <p className="text-xs text-muted-foreground">{typeLabels[competition.type] ?? competition.type} · {competition.season_year}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Momenteel niet ingeschreven voor een competitie.</p>
          )}
        </div>
      </div>
    </div>
  )
}
