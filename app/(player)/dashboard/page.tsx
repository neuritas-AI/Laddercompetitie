import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, User, Trophy, AlertCircle, ChevronRight, PenSquare } from 'lucide-react'
import Link from 'next/link'

export default function PlayerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">Welkom, Speler!</h1>
        <p className="text-gray-500 dark:text-muted-foreground">Klaar voor je volgende wedstrijd?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Next Match Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 border-l-4 border-l-accent shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Volgende Wedstrijd</span>
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> Nog 3 dagen
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between md:items-center mt-2">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tegenstander</p>
                  <p className="font-bold text-xl">Jan Peeters</p>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    Deadline: 15 Juli 2026
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col space-y-2">
                <Button className="w-full md:w-auto flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Plan een datum
                </Button>
                <Button variant="outline" className="w-full md:w-auto">
                  Stuur bericht
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranking & Poule Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mijn Positie</CardTitle>
            <CardDescription>Enkel Zomer - Poule 3</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center text-4xl font-black text-primary">
                #4
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-foreground">2 Gespeeld</p>
                <p className="text-xs text-green-600">1 Gewonnen</p>
                <p className="text-xs text-red-600">1 Verloren</p>
              </div>
            </div>
            <Link href="/ranking">
              <Button variant="ghost" className="w-full mt-4 justify-between group">
                Bekijk volledige poule
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors">
              <PenSquare className="w-6 h-6" />
              <span>Score ingeven</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors">
              <Calendar className="w-6 h-6" />
              <span>Mijn agenda</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors">
              <Trophy className="w-6 h-6" />
              <span>Competities</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors">
              <User className="w-6 h-6" />
              <span>Mijn profiel</span>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Laatste Resultaten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-muted rounded-lg border border-gray-100 dark:border-border">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">vs. Tom Smet</span>
                  <span className="text-xs text-gray-500">20 Juni 2026</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-green-600">Gewonnen</span>
                  <span className="text-sm font-mono">6-4, 6-2</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-muted rounded-lg border border-gray-100 dark:border-border">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">vs. Bart Janssens</span>
                  <span className="text-xs text-gray-500">10 Juni 2026</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-red-600">Verloren</span>
                  <span className="text-sm font-mono">3-6, 4-6</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4">
              Bekijk alle wedstrijden
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
