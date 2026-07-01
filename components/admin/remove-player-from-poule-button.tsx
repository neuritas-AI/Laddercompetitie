'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { removePlayerFromPoule } from '@/app/actions/admin'

export default function RemovePlayerFromPouleButton({ playerId, pouleId }: { playerId: string; pouleId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRemove = () => {
    setError(null)
    startTransition(async () => {
      const result = await removePlayerFromPoule(playerId, pouleId)
      if (!result.success) {
        setError(result.error ?? 'Kon speler niet verwijderen.')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-semibold text-red-600" onClick={handleRemove} disabled={isPending}>
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
