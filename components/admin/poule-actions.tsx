'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updatePoule, deletePoule } from '@/app/actions/admin'

export function PouleActions({ poule, competitions }: { poule: any; competitions: any[] }) {
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formState, setFormState] = useState({
    name: poule.name,
    level: String(poule.level ?? 1),
    competition_id: poule.competition_id,
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePoule(poule.id, formData)
      if (result.success) {
        setOpen(false)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePoule(poule.id)
      if (result.success) {
        setDeleteOpen(false)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon" aria-label={`Acties voor ${poule.name}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Bewerken
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" /> Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Poule bewerken</DialogTitle>
            <DialogDescription>Pas naam, niveau of competitie aan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`poule-name-${poule.id}`}>Naam</Label>
              <Input id={`poule-name-${poule.id}`} name="name" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`poule-level-${poule.id}`}>Niveau</Label>
              <Input id={`poule-level-${poule.id}`} name="level" type="number" min="1" value={formState.level} onChange={(e) => setFormState({ ...formState, level: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`poule-competition-${poule.id}`}>Competitie</Label>
              <Select name="competition_id" value={formState.competition_id} onValueChange={(value) => setFormState({ ...formState, competition_id: value })}>
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
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Annuleren</Button>
              <Button type="submit" disabled={isPending} className="font-bold">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Opslaan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Poule verwijderen?</DialogTitle>
            <DialogDescription>Deze actie deactiveert de poule zonder historische resultaten te verwijderen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} type="button">Annuleren</Button>
            <Button onClick={handleDelete} disabled={isPending} className="font-bold text-red-600">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
