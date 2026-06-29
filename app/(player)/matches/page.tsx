import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function MatchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">Mijn Wedstrijden</h1>
        <p className="text-gray-500 dark:text-muted-foreground">Bekijk je geplande en afgelopen wedstrijden.</p>
      </div>

      {/* Tabs / Filters (Mocked) */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-border pb-2">
        <Button variant="default" size="sm" className="rounded-full">Aankomend</Button>
        <Button variant="ghost" size="sm" className="rounded-full">Afgelopen</Button>
        <Button variant="ghost" size="sm" className="rounded-full">Nog te plannen</Button>
      </div>

      <div className="space-y-4">
        {/* Match Card: Scheduled */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tegen Jan Peeters</CardTitle>
              <CardDescription>Enkel Zomer - Poule 3</CardDescription>
            </div>
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
              Gepland
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm text-gray-600 dark:text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                  Woensdag 10 Juli 2026
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-primary" />
                  19:00 - 20:30
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  Terrein 2 (Buiten)
                </div>
              </div>
              <div className="flex flex-col space-y-2 justify-center">
                <Button variant="outline" className="w-full">Bericht sturen</Button>
                <Button className="w-full bg-accent hover:bg-accent/90 text-white">Score Ingeven</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Card: Needs scheduling */}
        <Card className="border-l-4 border-l-yellow-400">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tegen Sarah Smits</CardTitle>
              <CardDescription>Enkel Zomer - Poule 3</CardDescription>
            </div>
            <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
              Te plannen
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
                <span>Deadline: <strong>15 Juli 2026</strong></span>
              </div>
              <Button className="w-full md:w-auto">Plan een datum</Button>
            </div>
          </CardContent>
        </Card>

        {/* Match Card: Played/Confirmed */}
        <Card className="opacity-75">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tegen Tom Smet</CardTitle>
              <CardDescription>Enkel Zomer - Poule 3</CardDescription>
            </div>
            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Bevestigd
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Gespeeld op 20 Juni 2026
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-green-600">Gewonnen</span>
                <span className="font-mono bg-gray-100 dark:bg-muted px-2 py-1 rounded">6-4, 6-2</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
