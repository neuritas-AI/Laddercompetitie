'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'

export default function DoubleEnrollDialog({ competitionId, open, onOpenChange }: { competitionId: string, open: boolean, onOpenChange: (v: boolean) => void }) {
  const [players, setPlayers] = useState<any[]>([])
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPlayers() {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('profiles').select('id, first_name, last_name').eq('is_active', true).order('first_name')
        setPlayers(data ?? [])
      } catch (err) {
        setPlayers([])
      }
    }
    if (open) loadPlayers()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!partnerId) {
      setError('Kies een partner')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/competitions/enroll-double', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId, partnerId, teamName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fout bij inschrijven')
      onOpenChange(false)
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Onbekende fout')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dubbel inschrijven</DialogTitle>
          <DialogDescription>Kies je partner en voltooi de betaling.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label>Partner</Label>
            <select value={partnerId ?? ''} onChange={(e) => setPartnerId(e.target.value)} className="w-full rounded-lg border p-2">
              <option value="">Kies partner</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Teamnaam (optioneel)</Label>
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Teamnaam" />
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Inschrijven...' : 'Inschrijven en Betalen'}</Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuleer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
