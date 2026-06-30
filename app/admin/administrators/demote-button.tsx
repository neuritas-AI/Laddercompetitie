'use client'

import { useTransition } from 'react'
import { demoteFromAdmin } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Loader2, UserMinus } from 'lucide-react'

export default function DemoteAdminButton({ userId, currentUserId }: { userId: string, currentUserId: string }) {
  const [isPending, startTransition] = useTransition()

  if (userId === currentUserId) return null

  const handleDemote = () => {
    if (!confirm('Weet je zeker dat je de admin rechten van deze gebruiker wil intrekken?')) return
    
    startTransition(async () => {
      const res = await demoteFromAdmin(userId)
      if (!res.success) {
        alert(res.error)
      }
    })
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleDemote}
      disabled={isPending}
      className="h-9 font-bold rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
    >
      {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserMinus className="w-4 h-4 mr-1" />}
      Rechten intrekken
    </Button>
  )
}
