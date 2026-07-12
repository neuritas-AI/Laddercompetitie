'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { removePlayerFromPoule } from '@/app/actions/admin'

export default function RemovePlayerFromPouleButton({
  playerId,
  pouleId,
  onRemoved,
}: {
  playerId: string
  pouleId: string
  onRemoved?: () => void
}) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRemove = async () => {
    setError(null)
    setRemoving(true)
    try {
      const result = await removePlayerFromPoule(playerId, pouleId)
      if (!result.success) {
        setError(result.error ?? 'Kon speler niet verwijderen.')
        return
      }
      // Update the list immediately instead of waiting on the server refresh
      // below to complete — that refresh is only there to resync positions
      // for the players that remain.
      onRemoved?.()
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Kon speler niet verwijderen.')
    } finally {
      // Always clear the spinner once the action settles, regardless of how
      // long the (fire-and-forget) router refresh above takes.
      setRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-semibold text-red-600" onClick={handleRemove} disabled={removing}>
        {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
