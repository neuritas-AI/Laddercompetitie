'use client'

import { useState, useTransition } from 'react'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { movePlayerToPoule } from '@/app/actions/admin'

type Player = { id: string; name: string }
type Poule = { id: string; name: string }

export default function MovePlayerDialog({ player, poules, currentPouleId }: { player: Player; poules: Poule[]; currentPouleId: string }) {
  const [open, setOpen] = useState(false)
  const [selectedPoule, setSelectedPoule] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!selectedPoule || selectedPoule === currentPouleId) return

    startTransition(async () => {
      const result = await movePlayerToPoule(player.id, currentPouleId, selectedPoule)
      if (result.success) {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-semibold">
          <ArrowRightLeft className="mr-2 h-3.5 w-3.5" /> Verplaatsen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Speler verplaatsen</DialogTitle>
          <DialogDescription>Verplaats {player.name} naar een andere poule.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nieuwe poule</Label>
            <Select value={selectedPoule} onValueChange={(value: unknown) => setSelectedPoule(String(value ?? ''))}>
              <SelectTrigger>
                <SelectValue placeholder="Kies poule" />
              </SelectTrigger>
              <SelectContent>
                {poules.filter((p) => p.id !== currentPouleId).map((poule) => (
                  <SelectItem key={poule.id} value={poule.id}>{poule.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isPending || !selectedPoule} className="font-bold">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verplaatsen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
