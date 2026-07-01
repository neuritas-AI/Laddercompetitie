'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generatePouleGroups } from '@/app/actions/admin'

type Competition = { id: string; name: string }

export default function GeneratePoulesDialog({ competitions }: { competitions: Competition[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await generatePouleGroups(formData)
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error ?? 'Er is iets misgegaan.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" className="font-bold rounded-xl">
          <Sparkles className="mr-2 h-4 w-4" /> Automatisch genereren
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Automatische poules maken</DialogTitle>
          <DialogDescription>Maak meerdere poules op basis van een competitie en gewenste poulegrootte.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="competition_id">Competitie</Label>
            <Select name="competition_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Kies competitie" />
              </SelectTrigger>
              <SelectContent>
                {competitions.map((competition) => (
                  <SelectItem key={competition.id} value={competition.id}>{competition.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="players_per_poule">Spelers per poule</Label>
            <Input id="players_per_poule" name="players_per_poule" type="number" min="2" required defaultValue="6" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strategy">Verdeling</Label>
            <Select name="strategy" defaultValue="random">
              <SelectTrigger>
                <SelectValue placeholder="Kies verdeling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Willekeurig verdelen</SelectItem>
                <SelectItem value="ranking">Op basis van huidige ranking</SelectItem>
                <SelectItem value="last_season">Op basis van vorig seizoen</SelectItem>
                <SelectItem value="manual">Handmatig later aanpassen</SelectItem>
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
