import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Calendar, CheckCircle, Ban, Shield, Trophy, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminClient } from '@/utils/supabase/admin'
import { REGISTRATION_STATUS_LABELS } from '@/lib/competitions'
import { getDisplayName, getInitials } from '@/lib/profile'

export default async function AdminPlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>
}) {
  const { playerId } = await params
  const supabase = await requireAdminClient()

  if (!supabase) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/admin/players" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Terug naar spelers
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-[1.5rem] border border-border/50">
          <p className="font-bold text-muted-foreground text-lg">Niet geautoriseerd</p>
        </div>
      </div>
    )
  }

  const { data: player } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, avatar_url, role, is_active, created_at')
    .eq('id', playerId)
    .maybeSingle()

  if (!player) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/admin/players" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Terug naar spelers
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-[1.5rem] border border-border/50">
          <p className="font-bold text-muted-foreground text-lg">Speler niet gevonden</p>
        </div>
      </div>
    )
  }

  const [{ data: registrations }, { data: teamMemberships }] = await Promise.all([
    supabase
      .from('competition_registrations')
      .select('status, registered_at, amount, competitions(id, name, type, season_year)')
      .eq('player_id', playerId)
      .order('registered_at', { ascending: false }),
    supabase
      .from('team_members')
      .select('team_id, teams(id, name)')
      .eq('player_id', playerId),
  ])

  const teamIds = (teamMemberships ?? []).map((t: any) => t.team_id)

  const [{ data: teamRegistrations }, { data: partnerMemberships }] = await Promise.all([
    teamIds.length
      ? supabase
          .from('competition_team_registrations')
          .select('status, created_at, amount, team_id, competitions(id, name, type, season_year)')
          .in('team_id', teamIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    teamIds.length
      ? supabase
          .from('team_members')
          .select('team_id, player_id, profiles(first_name, last_name)')
          .in('team_id', teamIds)
          .neq('player_id', playerId)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const partnerByTeamId = new Map<string, string>()
  for (const membership of partnerMemberships ?? []) {
    const p = (membership as any).profiles
    const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Onbekend' : 'Onbekend'
    partnerByTeamId.set((membership as any).team_id, name)
  }

  const singleEntries = (registrations ?? [])
    .filter((r: any) => r.competitions)
    .map((r: any) => ({
      key: `single-${r.competitions.id}`,
      competition: r.competitions,
      status: r.status,
      created_at: r.registered_at,
      amount: r.amount,
      partner: null as string | null,
    }))

  const doubleEntries = (teamRegistrations ?? [])
    .filter((r: any) => r.competitions)
    .map((r: any) => ({
      key: `team-${r.team_id}-${r.competitions.id}`,
      competition: r.competitions,
      status: r.status,
      created_at: r.created_at,
      amount: r.amount,
      partner: partnerByTeamId.get(r.team_id) ?? null,
    }))

  const entries = [...singleEntries, ...doubleEntries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const displayName = getDisplayName(player)
  const initials = getInitials(player)
  const roleLabel = player.role === 'admin' ? 'Admin' : 'Speler'

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6 lg:p-8">
      <Link href="/admin/players" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Terug naar spelers
      </Link>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-muted/30 border-b border-border/50 p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center font-black text-gray-500 text-xl">
            {player.avatar_url ? <img src={player.avatar_url} alt={displayName} className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" /> {roleLabel}
              </span>
              {player.is_active
                ? <span className="flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Actief</span>
                : <span className="flex items-center gap-1 text-xs font-bold text-red-600"><Ban className="w-3.5 h-3.5" /> Inactief</span>
              }
            </div>
            <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {player.email}</span>
              {player.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {player.phone}</span>}
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Lid sinds {new Date(player.created_at).toLocaleDateString('nl-BE')}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Competities ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length > 0 ? (
            <div className="divide-y divide-border/40">
              {entries.map((entry) => {
                const statusLabel = REGISTRATION_STATUS_LABELS[entry.status] ?? entry.status
                const statusColor = entry.status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : entry.status === 'paid_test'
                  ? 'bg-blue-100 text-blue-800'
                  : entry.status === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-800'
                const isDouble = entry.competition.type.startsWith('double')
                const isWinter = entry.competition.type.endsWith('winter')
                const kindLabel = isDouble ? 'Dubbel' : 'Enkel'
                const seasonLabel = isWinter ? 'Winter' : 'Zomer'
                const amountLabel = entry.amount != null
                  ? new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(Number(entry.amount))
                  : '—'
                return (
                  <div key={entry.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5">
                    <div>
                      <p className="font-bold text-foreground text-sm">{entry.competition.name}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {kindLabel} · {seasonLabel} {entry.competition.season_year}
                        {entry.partner && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Users className="w-3 h-3" /> Partner: {entry.partner}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Ingeschreven {new Date(entry.created_at).toLocaleDateString('nl-BE')}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {amountLabel}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground">Geen competitie-inschrijvingen</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
