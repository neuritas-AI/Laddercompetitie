'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCompetition } from '@/app/actions/admin'

export default function AddCompetitionDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createCompetition(formData)
      if (res.success) {
        setOpen(false)
      } else {
        setError(res.error ?? 'Er is een fout opgetreden bij het aanmaken.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="flex items-center bg-primary hover:bg-primary/90 text-white font-bold rounded-xl" />}>
        <Plus className="w-4 h-4 mr-2" /> Nieuwe Competitie
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nieuwe competitie aanmaken</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam (bijv. Zomer 2026)</Label>
            <Input id="name" name="name" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" required defaultValue="single_summer">
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
              <Input id="season_year" name="season_year" type="number" required defaultValue={new Date().getFullYear()} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum</Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Einddatum</Label>
              <Input id="end_date" name="end_date" type="date" required />
            </div>
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
