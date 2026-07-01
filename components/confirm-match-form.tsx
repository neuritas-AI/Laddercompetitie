'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  matchId: string
  opponentName: string
  scoreLine: string
}

export default function ConfirmMatchForm({ matchId, opponentName, scoreLine }: Props) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async (action: 'approved' | 'disputed') => {
    setError(null)
    if (action === 'disputed' && note.trim().length === 0) {
      setError('Geef een reden op bij betwisting.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/matches/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreId: matchId, action, note: note.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fout bij bevestigen')
      setSuccess(action === 'approved' ? 'Score goedgekeurd!' : 'Score betwist. De wedstrijd wordt opnieuw beoordeeld.' )
      setTimeout(() => router.push('/matches'), 1800)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-[2rem] bg-card border border-border/50 p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">{success}</h2>
        <p className="mt-3 text-muted-foreground">Je wordt teruggestuurd naar je wedstrijden.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 rounded-[2rem] bg-card border border-border/50 p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Tegenstander</p>
        <h1 className="text-3xl font-black">{opponentName}</h1>
      </div>

      <div className="rounded-3xl bg-muted/50 p-6">
        <p className="text-sm text-muted-foreground">Ingevoerd eindresultaat</p>
        <p className="mt-3 text-4xl font-black">{scoreLine}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-note">Opmerking</Label>
        <Input
          id="confirm-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Leg uit waarom je deze score betwist (optioneel bij goedkeuren)."
          className="h-20 rounded-3xl p-4"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700 text-white font-bold"
          onClick={() => handleConfirm('approved')}
        >
          {submitting ? 'Bezig...' : 'Score goedkeuren'}
        </Button>
        <Button
          type="button"
          disabled={submitting}
          className="bg-red-600 hover:bg-red-700 text-white font-bold"
          onClick={() => handleConfirm('disputed')}
        >
          {submitting ? 'Bezig...' : 'Score betwisten'}
        </Button>
      </div>
    </div>
  )
}
