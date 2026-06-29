import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function AdminCompetitionsPage() {
  const competitions = [
    { id: 1, name: "Zomer 2026", type: "Enkel Zomer", status: "Actief", players: 64, poules: 8 },
    { id: 2, name: "Winter 2025", type: "Enkel Winter", status: "Afgesloten", players: 48, poules: 6 },
    { id: 3, name: "Dubbel Zomer 2026", type: "Dubbel Zomer", status: "Actief", players: 32, poules: 4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">Competities</h1>
          <p className="text-gray-500 dark:text-muted-foreground">Beheer alle competities en poules.</p>
        </div>
        <Button className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Competitie
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Competities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Spelers</TableHead>
                  <TableHead className="text-center">Poules</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitions.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell className="font-medium">{comp.name}</TableCell>
                    <TableCell>{comp.type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${comp.status === 'Actief' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {comp.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{comp.players}</TableCell>
                    <TableCell className="text-center">{comp.poules}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
