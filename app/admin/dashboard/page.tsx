import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Trophy, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-muted-foreground">Overzicht en statistieken van de Tennis Ladder.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totaal Spelers</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              +12 deze maand
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actieve Competities</CardTitle>
            <Trophy className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-gray-500 mt-1">
              Zomer 2026 editie bezig
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Wedstrijden Gepland</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-gray-500 mt-1">
              Deze week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Openstaande Scores</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">12</div>
            <p className="text-xs text-gray-500 mt-1">
              Wachten op bevestiging
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Registrations */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Nieuwe Registraties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between bg-white dark:bg-card border border-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                      {`N${i}`}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Nieuwe Speler {i}</p>
                      <p className="text-xs text-gray-500">Enkel Zomer, Dubbel Zomer</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Betaald</span>
                    <span className="text-xs text-gray-400 mt-1">Zojuist</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Competitions Quick Actions */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Competitie Beheer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-muted p-4 rounded-lg border border-gray-200 dark:border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Einde Speelperiode</h3>
                    <p className="text-sm text-gray-500">Volgende periode berekening is over 5 dagen.</p>
                  </div>
                  <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90">
                    Handmatig Berekenen
                  </button>
                </div>
                <div className="mt-4 flex space-x-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">8</span> poules
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">64</span> spelers
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
