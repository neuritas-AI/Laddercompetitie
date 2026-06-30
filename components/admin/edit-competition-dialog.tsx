'use client'

import { useState, useTransition } from 'react'
import { Edit, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateCompetition } from '@/app/actions/admin'

export default function EditCompetitionDialog({ competition }: { competition: any }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await updateCompetition(competition.id, formData)
      if (res.success) {
        setOpen(false)
      } else {
        setError(res.error ?? 'Er is een fout opgetreden bij het opslaan.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="h-9 font-bold rounded-lg" />}>
        <Edit className="h-4 w-4 mr-1 text-blue-600" /> Bewerken
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Competitie bewerken</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam</Label>
            <Input id="name" name="name" required defaultValue={competition.name} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" required defaultValue={competition.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_summer">Enkel Zomer</SelectItem>
                  <SelectItem value="single_winter">Enkel Winter</SelectItem>
                  <SelectItem value="double_summer">Dubbel Zomer</SelectItem>
                  <SelectItem value="double_winter">Dubbel Winter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="season_year">Seizoen Jaar</Label>
              <Input id="season_year" name="season_year" type="number" required defaultValue={competition.season_year} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum</Label>
              <Input id="start_date" name="start_date" type="date" required defaultValue={competition.start_date} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Einddatum</Label>
              <Input id="end_date" name="end_date" type="date" required defaultValue={competition.end_date} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={competition.status || 'draft'}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Concept</SelectItem>
                  <SelectItem value="open">Open voor inschrijving</SelectItem>
                  <SelectItem value="closed">Gesloten</SelectItem>
                  <SelectItem value="finished">Afgelopen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max. deelnemers</Label>
              <Input id="max_participants" name="max_participants" type="number" min="2" defaultValue={competition.max_participants || 32} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Kostprijs (€)</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" defaultValue={competition.price ?? 0} />
            </div>
          </div>

          {error && <div className="text-sm font-medium text-red-500">{error}</div>}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="font-bold">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Opslaan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
