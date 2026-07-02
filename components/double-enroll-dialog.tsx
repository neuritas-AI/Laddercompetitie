'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function DoubleEnrollDialog({ competitionId, open, onOpenChange }: { competitionId: string, open: boolean, onOpenChange: (v: boolean) => void }) {
  const [players, setPlayers] = useState<any[]>([])
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    setPlayers([])
    setPage(1)
    setHasMore(false)
    setPartnerId(null)
    setSearchError(null)
    if (open) {
      loadPlayers(query, 1)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }
    debounceRef.current = window.setTimeout(() => {
      setPage(1)
      loadPlayers(query, 1)
    }, 250)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, open])

  async function loadPlayers(search: string, pageToLoad: number) {
    setLoading(true)
    setSearchError(null)
    try {
      const url = new URL('/api/competitions/search-partners', window.location.origin)
      url.searchParams.set('competitionId', competitionId)
      url.searchParams.set('q', search)
      url.searchParams.set('page', String(pageToLoad))
      url.searchParams.set('pageSize', '20')

      const res = await fetch(url.toString())
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fout bij zoeken')

      setPlayers(prev => pageToLoad === 1 ? json.data : [...prev, ...json.data])
      setHasMore(json.hasMore)
      setPage(pageToLoad)
    } catch (err: any) {
      setSearchError(err.message || 'Fout bij zoeken')
    } finally {
      setLoading(false)
    }
  }

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
          <div className="space-y-2">
            <Label htmlFor="partner_search">Partner</Label>
            <Input
              id="partner_search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op voor- of achternaam"
              className="w-full"
            />
            <div className="relative">
              <select
                value={partnerId ?? ''}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full rounded-lg border p-2 mt-2"
                size={Math.min(players.length || 3, 6)}
              >
                <option value="">Kies partner</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>
            {loading && (
              <p className="text-sm text-muted-foreground">Zoeken...</p>
            )}
            {searchError && (
              <p className="text-sm text-red-600">{searchError}</p>
            )}
            {!loading && players.length === 0 && (
              <p className="text-sm text-muted-foreground">Geen spelers gevonden.</p>
            )}
            {hasMore && (
              <Button variant="secondary" type="button" onClick={() => loadPlayers(query, page + 1)} className="mt-2 w-full">
                {loading ? 'Laden...' : 'Meer laden'}
              </Button>
            )}
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
