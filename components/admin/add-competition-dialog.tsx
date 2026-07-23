'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCompetition } from '@/app/actions/admin'

const WINTER_TYPES = new Set(['single_winter', 'double_winter'])
const DEFAULT_PERIOD_COUNT = 3

export default function AddCompetitionDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState('single_summer')
  const [periodCount, setPeriodCount] = useState(DEFAULT_PERIOD_COUNT)
  const [noLimit, setNoLimit] = useState(true)

  const isWinter = WINTER_TYPES.has(type)

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nieuwe competitie aanmaken</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam</Label>
            <Input id="name" name="name" required placeholder="Competitienaam" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" required value={type} onValueChange={(value: unknown) => setType(String(value ?? 'single_summer'))}>
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

          {!isWinter && (
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
          )}

          {isWinter && (
            <div className="space-y-3 rounded-xl border border-input p-4 bg-muted/20">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Snowflake className="w-4 h-4 text-primary" />
                Periodes
              </div>
              <p className="text-xs text-muted-foreground">
                Geen algemene start-/einddatum nodig: de competitie loopt van de start van periode 1 tot het einde van de laatste periode.
                Na elke periode stijgen de bovenste 2 en dalen de onderste 2 spelers/teams per poule naar de volgende periode.
              </p>
              <div className="space-y-2">
                <Label htmlFor="period_count">Aantal periodes</Label>
                <Input
                  id="period_count"
                  name="period_count"
                  type="number"
                  min="1"
                  max="12"
                  value={periodCount}
                  onChange={(e) => setPeriodCount(Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1)))}
                />
              </div>
              <div className="space-y-3">
                {Array.from({ length: periodCount }, (_, i) => i + 1).map((periodNumber) => (
                  <div key={periodNumber} className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`period_start_${periodNumber}`} className="text-xs">Periode {periodNumber} start</Label>
                      <Input id={`period_start_${periodNumber}`} name={`period_start_${periodNumber}`} type="date" required className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`period_end_${periodNumber}`} className="text-xs">Periode {periodNumber} einde</Label>
                      <Input id={`period_end_${periodNumber}`} name={`period_end_${periodNumber}`} type="date" required className="h-9" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="draft">
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
              <label className="flex items-center gap-2 h-9 text-sm text-muted-foreground font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={noLimit}
                  onChange={(e) => setNoLimit(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary"
                />
                Geen maximum
              </label>
              {!noLimit && (
                <Input id="max_participants" name="max_participants" type="number" min="2" placeholder="Bijv. 32" required autoFocus />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Kostprijs (€)</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" defaultValue="0" placeholder="0.00" />
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
