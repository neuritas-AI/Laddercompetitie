'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
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

const formatPlayerName = (player: Player) =>
  `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim() || 'Onbekende speler'

export default function AddPouleDialog({ competitions, players }: { competitions: Competition[]; players: Player[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const removePlayer = (id: string) => {
    setSelectedIds((prev) => prev.filter((p) => p !== id))
  }

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createPoule(formData)
      if (res.success) {
        setOpen(false)
        setSelectedIds([])
      } else {
        setError(res.error ?? 'Er is een fout opgetreden bij het aanmaken.')
      }
    })
  }

  const selectedPlayers = selectedIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSelectedIds([])
      }}
    >
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl" />}>
        <Plus className="w-4 h-4 mr-2" /> Nieuwe Poule
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
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
            <Label>Spelers toevoegen</Label>
            <p className="text-xs text-muted-foreground mb-2">Klik op een speler om die te selecteren. Wedstrijden worden automatisch aangemaakt nadat je de poule bevestigt.</p>

            {selectedPlayers.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                  Geselecteerde spelers ({selectedPlayers.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPlayers.map((player) => (
                    <span
                      key={player.id}
                      className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold pl-2.5 pr-1.5 py-1 rounded-full"
                    >
                      {formatPlayerName(player)}
                      <button
                        type="button"
                        onClick={() => removePlayer(player.id)}
                        aria-label={`${formatPlayerName(player)} verwijderen uit selectie`}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-52 overflow-y-auto rounded-xl border border-input divide-y divide-border/50">
              {players.map((player) => {
                const isSelected = selectedIds.includes(player.id)
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors',
                      isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-md border shrink-0 transition-colors',
                        isSelected ? 'bg-primary border-primary text-white' : 'border-input'
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </span>
                    {formatPlayerName(player)}
                  </button>
                )
              })}
            </div>

            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="player_ids" value={id} />
            ))}
          </div>

          {error && <div className="text-sm font-medium text-red-500">{error}</div>}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="font-bold">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Poule aanmaken
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
