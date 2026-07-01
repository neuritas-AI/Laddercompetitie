'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createPoule } from '@/app/actions/admin'

type Competition = {
  id: string
  name: string
}

type Player = {
  id: string
  first_name?: string | null
  last_name?: string | null
}

export default function AddPouleDialog({ competitions, players }: { competitions: Competition[]; players: Player[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createPoule(formData)
      if (res.success) {
        setOpen(false)
      } else {
        setError(res.error ?? 'Er is een fout opgetreden bij het aanmaken.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl" />}>
        <Plus className="w-4 h-4 mr-2" /> Nieuwe Poule
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nieuwe poule aanmaken</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam (bijv. Poule A)</Label>
            <Input id="name" name="name" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="competition_id">Competitie</Label>
            <Select name="competition_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Kies competitie" />
              </SelectTrigger>
              <SelectContent>
                {competitions.map(comp => (
                  <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Niveau (1 is het hoogst)</Label>
            <Input id="level" name="level" type="number" min="1" required defaultValue="1" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player_ids">Spelers toevoegen</Label>
            <p className="text-xs text-muted-foreground mb-2">Kies één of meerdere spelers voor deze poule. Wedstrijden worden automatisch aangemaakt nadat je de poule bevestigt.</p>
            <select
              id="player_ids"
              name="player_ids"
              multiple
              size={6}
              className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {players.map((player) => {
                const label = `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim() || 'Onbekende speler'
                return (
                  <option key={player.id} value={player.id}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>

          {error && <div className="text-sm font-medium text-red-500">{error}</div>}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="font-bold">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aanmaken
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
