'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteCompetition } from '@/app/actions/admin'

export default function DeleteCompetitionButton({ id, pouleCount }: { id: string, pouleCount: number }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (pouleCount > 0) {
      alert('Deze competitie bevat nog actieve poules. Je kan deze niet verwijderen tenzij je eerst de poules verwijdert of de competitie afsluit.')
      return
    }

    if (confirm('Weet je zeker dat je deze competitie wil verwijderen? Deze actie is onomkeerbaar.')) {
      startTransition(async () => {
        const res = await deleteCompetition(id)
        if (!res.success) {
          alert(res.error)
        } else {
          router.refresh()
        }
      })
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="h-9 font-bold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="h-4 w-4 text-red-600 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-600" />}
    </Button>
  )
}
