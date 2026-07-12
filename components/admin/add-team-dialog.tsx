'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTeam } from '@/app/actions/admin'

type Player = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
}

type Competition = {
  id: string
  name: string
  season_year: number
}

export default function AddTeamDialog({ players, competitions }: { players: Player[]; competitions: Competition[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createTeam(formData)
      if (res.success) {
        setOpen(false)
      } else {
        setError(res.error ?? 'Er is een fout opgetreden bij het aanmaken.')
      }
    })
  }

  const formatName = (p: Player) => [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl" />}>
        <Plus className="w-4 h-4 mr-2" /> Team Aanmaken
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nieuw dubbelteam aanmaken</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Teamnaam</Label>
            <Input id="name" name="name" required placeholder="Teamnaam" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="competition_id">Competitie</Label>
            <Select name="competition_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Kies competitie" />
              </SelectTrigger>
              <SelectContent>
                {competitions.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.season_year})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="player1_id">Speler 1</Label>
            <Select name="player1_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Kies speler 1" />
              </SelectTrigger>
              <SelectContent>
                {players.map(p => (
                  <SelectItem key={p.id} value={p.id}>{formatName(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="player2_id">Speler 2</Label>
            <Select name="player2_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Kies speler 2" />
              </SelectTrigger>
              <SelectContent>
                {players.map(p => (
                  <SelectItem key={p.id} value={p.id}>{formatName(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
