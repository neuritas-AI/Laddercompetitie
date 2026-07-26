'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminEnrollPlayer } from '@/app/actions/admin'

type Competition = {
  id: string
  name: string
  type: string
  season_year: number
}

type Player = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
}

export default function EnrollPlayerDialog({
  playerId,
  playerName,
  competitions,
  players,
}: {
  playerId: string
  playerName: string
  competitions: Competition[]
  players: Player[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [competitionId, setCompetitionId] = useState('')

  const selectedCompetition = competitions.find((c) => c.id === competitionId)
  const isDouble = selectedCompetition?.type.startsWith('double') ?? false
  const partnerOptions = players.filter((p) => p.id !== playerId)

  const formatName = (p: Player) => [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await adminEnrollPlayer(formData)
      if (res.success) {
        setOpen(false)
        setCompetitionId('')
      } else {
        setError(res.error ?? 'Er is een fout opgetreden bij het inschrijven.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setError(null); setCompetitionId('') } }}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="h-9 font-bold rounded-lg" />}>
        <UserPlus className="h-4 w-4 mr-1.5 text-primary" /> Inschrijven voor competitie
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{playerName} inschrijven</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-2">
          <input type="hidden" name="player_id" value={playerId} />

          <div className="space-y-2">
            <Label htmlFor="competition_id">Competitie</Label>
            <Select
              name="competition_id"
              required
              value={competitionId}
              onValueChange={(value: unknown) => setCompetitionId(String(value ?? ''))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kies competitie" />
              </SelectTrigger>
              <SelectContent>
                {competitions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.season_year})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isDouble && (
            <div className="space-y-2">
              <Label htmlFor="partner_id">Dubbelpartner</Label>
              <Select name="partner_id" required={isDouble}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies partner" />
                </SelectTrigger>
                <SelectContent>
                  {partnerOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{formatName(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isDouble && (
            <div className="space-y-2">
              <Label htmlFor="team_name">Teamnaam (optioneel)</Label>
              <Input id="team_name" name="team_name" placeholder="Bijv. Team Naam" />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            De speler wordt ingeschreven zonder betaling. De betaling blijft openstaand en kan achteraf door de speler zelf via zijn account worden voldaan.
          </p>

          {error && <div className="text-sm font-medium text-red-500">{error}</div>}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending || !competitionId} className="font-bold">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Inschrijven
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
