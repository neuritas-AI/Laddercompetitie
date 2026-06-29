import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function RankingPage() {
  const currentUserId = "mock-user-1";

  const rankings = [
    { id: "u1", position: 1, name: "Lisa Peeters", played: 3, won: 3, lost: 0, setsDiff: "+5", trend: "up" },
    { id: "u2", position: 2, name: "Tom Smet", played: 4, won: 2, lost: 2, setsDiff: "0", trend: "same" },
    { id: "u3", position: 3, name: "Sarah Smits", played: 2, won: 2, lost: 0, setsDiff: "+4", trend: "up" },
    { id: currentUserId, position: 4, name: "Jij", played: 2, won: 1, lost: 1, setsDiff: "0", trend: "same" },
    { id: "u5", position: 5, name: "Jan Peeters", played: 3, won: 1, lost: 2, setsDiff: "-2", trend: "down" },
    { id: "u6", position: 6, name: "Bart Janssens", played: 4, won: 1, lost: 3, setsDiff: "-4", trend: "down" },
    { id: "u7", position: 7, name: "Klaas Vink", played: 2, won: 0, lost: 2, setsDiff: "-4", trend: "down" },
    { id: "u8", position: 8, name: "Emma De Vries", played: 0, won: 0, lost: 0, setsDiff: "0", trend: "same" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground flex items-center">
            <Trophy className="w-8 h-8 mr-2 text-accent" />
            Ranking
          </h1>
          <p className="text-gray-500 dark:text-muted-foreground">Overzicht van alle poules en spelers.</p>
        </div>
        
        <div className="w-full md:w-64">
          <Select defaultValue="summer_p3">
            <SelectTrigger>
              <SelectValue placeholder="Selecteer een poule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summer_p1">Enkel Zomer - Poule 1</SelectItem>
              <SelectItem value="summer_p2">Enkel Zomer - Poule 2</SelectItem>
              <SelectItem value="summer_p3">Enkel Zomer - Poule 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enkel Zomer - Poule 3</CardTitle>
          <CardDescription>Huidige stand. Positie 1 en 2 promoveren, positie 7 en 8 degraderen.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Pos</TableHead>
                  <TableHead>Speler</TableHead>
                  <TableHead className="text-center">G</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">V</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Set saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((row) => (
                  <TableRow 
                    key={row.id} 
                    className={`${row.id === currentUserId ? 'bg-primary/5 font-medium border-l-4 border-l-primary' : ''} 
                               ${row.position <= 2 ? 'bg-green-50/30' : ''} 
                               ${row.position >= 7 ? 'bg-red-50/30' : ''}`}
                  >
                    <TableCell className="text-center font-bold">
                      <div className="flex items-center justify-center space-x-1">
                        <span>{row.position}</span>
                        {row.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {row.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                        {row.trend === 'same' && <Minus className="w-3 h-3 text-gray-400" />}
                      </div>
                    </TableCell>
                    <TableCell className="flex items-center">
                      {row.name}
                      {row.id === currentUserId && (
                        <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">
                          Jij
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{row.played}</TableCell>
                    <TableCell className="text-center text-green-600">{row.won}</TableCell>
                    <TableCell className="text-center text-red-600">{row.lost}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell text-gray-500">{row.setsDiff}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-50 border border-green-200 mr-2"></div>
              Promotie
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-50 border border-red-200 mr-2"></div>
              Degradatie
            </div>
            <div className="flex items-center ml-auto">
              G = Gespeeld, W = Gewonnen, V = Verloren
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
