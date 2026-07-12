import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Trophy, Users } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import AddCompetitionDialog from '@/components/admin/add-competition-dialog'
import UpdateCompetitionStatusButton from './update-status-button'
import EditCompetitionDialog from '@/components/admin/edit-competition-dialog'
import DeleteCompetitionButton from '@/components/admin/delete-competition-button'
import AdvancePeriodButton from '@/components/admin/advance-period-button'

const typeLabels: Record<string, string> = {
  single_winter: 'Enkel Winter',
  single_summer: 'Enkel Zomer',
  double_winter: 'Dubbel Winter',
  double_summer: 'Dubbel Zomer',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Gesloten', color: 'bg-red-100 text-red-800' },
  finished: { label: 'Afgelopen', color: 'bg-gray-200 text-gray-800' },
  draft: { label: 'Concept', color: 'bg-yellow-100 text-yellow-800' },
}

export default async function AdminCompetitionsPage() {
  const supabase = await createClient()

  // Fetch competitions with poule & player counts
  const { data: competitions } = await supabase
    .from('competitions')
    .select(`
      id,
      name,
      type,
      is_active,
      season_year,
      start_date,
      end_date,
      status,
      max_participants,
      price,
      poules(id, is_active),
      competition_periods(id, period_number, start_date, end_date, status)
    `)
    .order('season_year', { ascending: false })

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">Competities</h1>
          <p className="text-gray-500 dark:text-muted-foreground">Beheer alle competities en poules.</p>
        </div>
        <AddCompetitionDialog />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Alle Competities ({competitions?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {competitions && competitions.length > 0 ? (
            <div className="divide-y divide-border/40">
              {competitions.map((comp) => {
                // Soft-deleted poules (is_active: false) stay in the database for
                // history but should never count toward "this competition still
                // has poules" — otherwise a competition can never be deleted once
                // it has ever had a poule removed.
                const pouleCount = ((comp.poules as any[]) ?? []).filter((p) => p.is_active).length
                const label = typeLabels[comp.type] ?? comp.type
                const statusInfo = statusLabels[comp.status || 'draft'] || statusLabels['draft']

                const periods = ((comp.competition_periods as any[]) ?? []).sort((a, b) => a.period_number - b.period_number)
                const currentPeriod = periods.find((p) => p.status === 'active') ?? null
                const nextPeriod = currentPeriod
                  ? periods.find((p) => p.period_number === currentPeriod.period_number + 1) ?? null
                  : null
                return (
                  <div key={comp.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-5 hover:bg-muted/10 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground">{comp.name}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium mt-0.5">{label} · {comp.season_year}</p>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-6 w-full lg:w-auto">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Kostprijs</span>
                        <span className="text-sm font-semibold text-foreground">
                          {comp.price ? `€ ${Number(comp.price).toFixed(2)}` : 'Gratis'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                          <Users className="w-3 h-3" /> Max Spelers
                        </span>
                        <span className="text-sm font-semibold text-foreground">{comp.max_participants || 'Onbeperkt'}</span>
                      </div>
                      <div className="flex flex-col gap-1 min-w-[60px]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Poules</span>
                        <span className="text-sm font-black text-foreground">{pouleCount}</span>
                      </div>
                      <div className="flex flex-col gap-1 min-w-[100px]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                          {periods.length > 1 ? `Periode ${currentPeriod?.period_number ?? '?'}/${periods.length}` : 'Periode'}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {currentPeriod
                            ? `${new Date(currentPeriod.start_date).toLocaleDateString('nl-BE')} – ${new Date(currentPeriod.end_date).toLocaleDateString('nl-BE')}`
                            : `${new Date(comp.start_date).toLocaleDateString('nl-BE')} – ${new Date(comp.end_date).toLocaleDateString('nl-BE')}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto sm:ml-0">
                        {nextPeriod && (
                          <AdvancePeriodButton competitionId={comp.id} nextPeriodNumber={nextPeriod.period_number} />
                        )}
                        <UpdateCompetitionStatusButton competitionId={comp.id} currentStatus={comp.status || 'draft'} />
                        <EditCompetitionDialog competition={comp} />
                        <DeleteCompetitionButton id={comp.id} pouleCount={pouleCount} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Trophy className="w-14 h-14 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground text-lg">Nog geen competities aangemaakt</p>
              <p className="text-sm text-muted-foreground/70 mt-1 font-medium">Klik op "Nieuwe Competitie" om te beginnen.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
