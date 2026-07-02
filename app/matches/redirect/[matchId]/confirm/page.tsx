"use client"

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function MatchConfirmRedirectPage() {
  const router = useRouter()
  const params = useParams() as { matchId?: string }

  useEffect(() => {
    const id = params?.matchId
    if (!id) return
    router.replace(`/matches/${id}/confirm`)
  }, [params, router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="rounded-[2rem] border border-border/50 bg-card p-10 text-center shadow-sm">
        <h1 className="text-2xl font-bold">Doorsturen...</h1>
        <p className="mt-3 text-muted-foreground">Als je niet automatisch wordt doorverwezen, klik <a href={`/matches/${params.matchId}/confirm`} className="text-primary underline">hier</a>.</p>
      </div>
    </div>
  )
}
