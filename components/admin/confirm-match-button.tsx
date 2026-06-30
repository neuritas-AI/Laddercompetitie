'use client'

import { useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateMatchStatus } from '@/app/actions/admin'

export default function ConfirmMatchButton({ matchId }: { matchId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await updateMatchStatus(matchId, 'confirmed')
      if (!res.success) {
        alert(res.error)
      }
    })
  }

  return (
    <Button 
      size="sm" 
      onClick={handleConfirm}
      disabled={isPending}
      className="h-8 font-bold rounded-lg bg-primary hover:bg-primary/90 text-white text-xs"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
      Bevestigen
    </Button>
  )
}
