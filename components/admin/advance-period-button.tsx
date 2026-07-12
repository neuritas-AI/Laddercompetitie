'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronsUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { advancePeriod } from '@/app/actions/admin'

export default function AdvancePeriodButton({ competitionId, nextPeriodNumber }: { competitionId: string; nextPeriodNumber: number }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAdvance = () => {
    setError(null)
    if (!confirm(`Periode afsluiten en doorschuiven naar periode ${nextPeriodNumber}? De bovenste 2 spelers/teams per poule stijgen, de onderste 2 dalen, en er worden nieuwe wedstrijden aangemaakt.`)) {
      return
    }
    startTransition(async () => {
      const res = await advancePeriod(competitionId)
      if (!res.success) {
        setError(res.error ?? 'Kon niet doorschuiven naar de volgende periode.')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-9 font-bold rounded-lg"
        onClick={handleAdvance}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronsUp className="h-4 w-4 mr-2" />}
        Periode {nextPeriodNumber} starten
      </Button>
      {error && <p className="text-xs text-red-600 max-w-[220px] text-right">{error}</p>}
    </div>
  )
}
