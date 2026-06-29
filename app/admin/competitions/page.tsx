import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Trophy } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import AddCompetitionDialog from '@/components/admin/add-competition-dialog'

const typeLabels: Record<string, string> = {
  single_winter: 'Enkel Winter',
  single_summer: 'Enkel Zomer',
  double_winter: 'Dubbel Winter',
  double_summer: 'Dubbel Zomer',
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
      poules(id)
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
                const pouleCount = (comp.poules as any[])?.length ?? 0
                const label = typeLabels[comp.type] ?? comp.type
                return (
                  <div key={comp.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 hover:bg-muted/10 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground">{comp.name}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${comp.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {comp.is_active ? 'Actief' : 'Afgesloten'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium mt-0.5">{label} · {comp.season_year}</p>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-4 w-full sm:w-auto">
                      <div className="flex flex-col gap-1 min-w-[80px]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Poules</span>
                        <span className="text-lg font-black text-foreground">{pouleCount}</span>
                      </div>
                      <div className="flex flex-col gap-1 min-w-[100px]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Periode</span>
                        <span className="text-xs font-semibold text-foreground">
                          {new Date(comp.start_date).toLocaleDateString('nl-BE')} – {new Date(comp.end_date).toLocaleDateString('nl-BE')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto sm:ml-0">
                        <Button variant="outline" size="sm" className="h-9 font-bold rounded-lg">
                          <Edit className="h-4 w-4 mr-1 text-blue-600" /> Bewerken
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 font-bold rounded-lg">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
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
