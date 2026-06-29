'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, AlertCircle, Trophy } from 'lucide-react'

interface Props {
  matchId: string
  opponent: string
  competition: string
}

export default function ScoreForm({ matchId, opponent, competition }: Props) {
  const router = useRouter()
  const [p1Score, setP1Score] = useState<string>('')
  const [p2Score, setP2Score] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const winner = () => {
    const s1 = parseInt(p1Score)
    const s2 = parseInt(p2Score)
    if (isNaN(s1) || isNaN(s2)) return null
    if (s1 > s2) return 'p1'
    if (s2 > s1) return 'p2'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const s1 = parseInt(p1Score)
    const s2 = parseInt(p2Score)

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      setError('Vul geldige scores in (0 of hoger).')
      return
    }

    if (s1 === s2) {
      setError('Gelijkspel is niet toegestaan. Er moet een winnaar zijn.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/matches/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, p1Score: s1, p2Score: s2 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fout bij opslaan')
      setSuccess(true)
      setTimeout(() => router.push('/matches'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-card rounded-3xl shadow-sm border p-8">
        <CheckCircle2 className="h-16 w-16 text-primary" />
        <h2 className="text-2xl font-bold">Score succesvol ingegeven!</h2>
        <p className="text-muted-foreground">Je tegenstander wordt op de hoogte gesteld ter goedkeuring.</p>
      </div>
    )
  }

  const currentWinner = winner()

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <Card className="shadow-lg border-0 bg-card overflow-hidden rounded-[2rem]">
        <div className="bg-primary/5 p-6 border-b">
          <CardTitle className="text-2xl text-center">Totaal aantal games</CardTitle>
          <CardDescription className="text-center mt-2 text-sm font-medium">{competition}</CardDescription>
        </div>
        <CardContent className="p-8 space-y-8">
          
          <div className="flex items-center justify-between gap-6">
            {/* Player 1 */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <span className="font-bold text-lg">Jij</span>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={p1Score}
                onChange={(e) => setP1Score(e.target.value)}
                className={`text-center text-4xl font-black h-24 rounded-2xl bg-muted/50 border-2 transition-all focus-visible:ring-primary ${currentWinner === 'p1' ? 'border-primary text-primary bg-primary/5' : 'border-transparent'}`}
                required
              />
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center justify-center pb-2">
              <span className="text-muted-foreground/50 font-black text-xl italic">-</span>
            </div>

            {/* Player 2 */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <span className="font-bold text-lg truncate max-w-full" title={opponent}>{opponent}</span>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={p2Score}
                onChange={(e) => setP2Score(e.target.value)}
                className={`text-center text-4xl font-black h-24 rounded-2xl bg-muted/50 border-2 transition-all focus-visible:ring-primary ${currentWinner === 'p2' ? 'border-primary text-primary bg-primary/5' : 'border-transparent'}`}
                required
              />
            </div>
          </div>

          {currentWinner && (
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-primary/10 text-primary font-bold animate-in fade-in zoom-in duration-300">
              <Trophy className="h-5 w-5" />
              Winnaar: {currentWinner === 'p1' ? 'Jij' : opponent}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-md hover:shadow-lg transition-all" disabled={submitting}>
        {submitting ? 'Bezig met opslaan...' : 'Score Bevestigen'}
      </Button>
    </form>
  )
}
