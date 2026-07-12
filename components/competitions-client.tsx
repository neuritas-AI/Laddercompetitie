'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Trophy, Calendar, Loader2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'
import { enrollInCompetition, completeTestPayment } from '@/app/actions/competitions'
import { REGISTRATION_STATUS_LABELS } from '@/lib/competitions'
import DoubleEnrollDialog from './double-enroll-dialog'

export type CompetitionItem = {
  id: string
  name: string
  type: string
  season_year: number
  start_date: string
  end_date: string
  price: number
  status: string
  registrationStatus?: string | null
  isFull?: boolean
}

const typeLabels: Record<string, string> = {
  single_winter: 'Enkel',
  single_summer: 'Enkel',
  double_winter: 'Dubbel',
  double_summer: 'Dubbel',
}

const competitionStatusLabels: Record<string, string> = {
  open: 'Open voor inschrijving',
  closed: 'Gesloten',
  finished: 'Afgelopen',
  draft: 'Concept',
}

function formatPrice(price: number) {
  if (!price || price === 0) return 'Gratis'
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(price)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function CompetitionsClient({
  openCompetitions,
  myRegistrations,
}: {
  openCompetitions: CompetitionItem[]
  myRegistrations: CompetitionItem[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionItem | null>(null)
  const [doubleOpen, setDoubleOpen] = useState(false)
  const [paymentMsg, setPaymentMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set(myRegistrations.map(r => r.id)))

  const availableCompetitions = openCompetitions.filter(c => !registeredIds.has(c.id))

  function handleEnroll(competition: CompetitionItem) {
    if (competition.isFull) return
    setSelectedCompetition(competition)
    setPaymentMsg(null)
    if (competition.type.startsWith('double')) {
      setDoubleOpen(true)
      return
    }

    setPaymentOpen(true)

    startTransition(async () => {
      const result = await enrollInCompetition(competition.id)
      if (!result.success) {
        setPaymentMsg({ type: 'error', text: result.error ?? 'Inschrijving mislukt.' })
      } else {
        setRegisteredIds(prev => new Set([...Array.from(prev), competition.id]))
        setPaymentMsg({ type: 'success', text: 'Inschrijving voltooid!' })
        setTimeout(() => {
          setPaymentOpen(false)
          setSelectedCompetition(null)
          router.refresh()
        }, 800)
      }
    })
  }

  function handleTestPayment() {
    if (!selectedCompetition) return
    setPaymentMsg(null)

    startTransition(async () => {
      const result = await completeTestPayment(selectedCompetition.id)
      if (result.success) {
        setRegisteredIds(prev => new Set([...Array.from(prev), selectedCompetition.id]))
        setPaymentMsg({ type: 'success', text: 'Inschrijving voltooid! Je bent ingeschreven voor deze competitie.' })
        setTimeout(() => {
          setPaymentOpen(false)
          setSelectedCompetition(null)
          router.refresh()
        }, 1500)
      } else {
        setPaymentMsg({ type: 'error', text: result.error ?? 'Betaling mislukt.' })
      }
    })
  }

  function renderCompetitionCard(competition: CompetitionItem, showEnrollButton: boolean) {
    const typeLabel = typeLabels[competition.type] ?? competition.type
    const statusLabel = competition.registrationStatus
      ? REGISTRATION_STATUS_LABELS[competition.registrationStatus] ?? competition.registrationStatus
      : competitionStatusLabels[competition.status] ?? competition.status

    return (
      <Card key={competition.id} className="border border-border/50 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg text-foreground">{competition.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs font-semibold">{typeLabel}</Badge>
                  <span className="text-sm text-muted-foreground font-medium">Seizoen {competition.season_year}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 flex-1 lg:max-w-xl">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Startdatum</p>
                <p className="text-sm font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {formatDate(competition.start_date)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Einddatum</p>
                <p className="text-sm font-semibold">{formatDate(competition.end_date)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Kostprijs</p>
                <p className="text-sm font-bold text-primary">{formatPrice(competition.price)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Status</p>
                <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold">{statusLabel}</Badge>
              </div>
            </div>

            {showEnrollButton && (() => {
              const isRegistered = registeredIds.has(competition.id)
              if (isRegistered) {
                return (
                  <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-bold uppercase px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" /> Ingeschreven
                  </span>
                )
              }
              if (competition.isFull) {
                return (
                  <span className="inline-flex items-center gap-2 bg-red-100 text-red-800 text-sm font-bold uppercase px-3 py-2 rounded-xl">
                    Volzet
                  </span>
                )
              }
              return (
                <Button
                  onClick={() => handleEnroll(competition)}
                  disabled={isPending}
                  className="font-bold rounded-xl h-11 px-6 shrink-0"
                >
                  Schrijf mij in
                </Button>
              )
            })()}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black text-foreground">Beschikbare competities</h1>
        <p className="text-muted-foreground mt-1">Schrijf je in voor open competities en volg je inschrijvingen.</p>
      </div>

      {myRegistrations.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Mijn inschrijvingen</h2>
          <div className="space-y-3">
            {myRegistrations.map(comp => renderCompetitionCard(comp, false))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          {myRegistrations.length > 0 ? 'Nog beschikbaar' : 'Open competities'}
        </h2>
        {availableCompetitions.length > 0 ? (
          <div className="space-y-3">
            {availableCompetitions.map(comp => renderCompetitionCard(comp, true))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground">Geen open competities beschikbaar</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Er zijn momenteel geen competities open voor inschrijving.</p>
            </CardContent>
          </Card>
        )}
      </section>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Betaling
            </DialogTitle>
            <DialogDescription>
              {selectedCompetition && (
                <>Inschrijving voor <strong>{selectedCompetition.name}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              In testmodus wordt geen echte betaling uitgevoerd.
            </div>

            {selectedCompetition && (
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <span className="text-sm font-medium text-muted-foreground">Te betalen</span>
                <span className="text-xl font-black text-primary">
                  {formatPrice(selectedCompetition.price)}
                </span>
              </div>
            )}

            {paymentMsg && (
              <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                paymentMsg.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {paymentMsg.type === 'success'
                  ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                <span>{paymentMsg.text}</span>
              </div>
            )}

            <Button
              onClick={handleTestPayment}
              disabled={isPending || paymentMsg?.type === 'success'}
              className="w-full h-12 font-bold text-base"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testbetaling uitvoeren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {selectedCompetition && (
        <DoubleEnrollDialog competitionId={selectedCompetition.id} open={doubleOpen} onOpenChange={setDoubleOpen} />
      )}
    </div>
  )
}
