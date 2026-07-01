'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Competition = {
  id: string
  name: string
  label: string
  price: number
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const nameHasDigits = /\d/

export default function RegisterClient({
  competitions,
  errorMsg,
}: {
  competitions: Competition[]
  errorMsg?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [selectedComps, setSelectedComps] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  function toggleComp(id: string) {
    setSelectedComps(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const firstName = (formData.get('first_name') as string)?.trim()
    const lastName = (formData.get('last_name') as string)?.trim()
    const email = (formData.get('email') as string)?.trim()

    if (!emailPattern.test(email)) {
      setValidationError('Voer een geldig e-mailadres in.')
      return
    }

    if (!firstName || nameHasDigits.test(firstName)) {
      setValidationError('Voornaam mag geen cijfers bevatten.')
      return
    }

    if (!lastName || nameHasDigits.test(lastName)) {
      setValidationError('Achternaam mag geen cijfers bevatten.')
      return
    }

    setValidationError(null)

    // Remove any existing competitions values and add selected ones
    formData.delete('competitions')
    selectedComps.forEach(id => formData.append('competitions', id))

    startTransition(async () => {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        body: formData,
      })

      if (response.redirected) {
        window.location.href = response.url
      } else {
        window.location.href = '/register?error=Registratie mislukt, probeer opnieuw.'
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{decodeURIComponent(errorMsg)}</span>
        </div>
      )}
      {validationError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">Voornaam <span className="text-red-500">*</span></Label>
            <Input
              id="first_name"
              name="first_name"
              required
              placeholder="Voornaam"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Achternaam <span className="text-red-500">*</span></Label>
            <Input
              id="last_name"
              name="last_name"
              required
              placeholder="Achternaam"
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mailadres <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="E-mailadres"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefoonnummer <span className="text-red-500">*</span></Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="Telefoonnummer"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Wachtwoord <span className="text-red-500">*</span></Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Minimaal 8 tekens"
            minLength={8}
            className="h-11"
          />
        </div>
      </div>

      {competitions.length > 0 && (
        <div className="border-t pt-5">
          <h3 className="text-base font-semibold mb-1">Competities</h3>
          <p className="text-sm text-muted-foreground mb-4">Kies de competitie(s) waaraan je wilt deelnemen</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {competitions.map(comp => (
              <button
                key={comp.id}
                type="button"
                onClick={() => toggleComp(comp.id)}
                className={`flex flex-col items-start gap-3 cursor-pointer p-4 rounded-xl border-2 text-left transition-all ${
                  selectedComps.includes(comp.id)
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedComps.includes(comp.id)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedComps.includes(comp.id) && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm font-semibold">{comp.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">{comp.price > 0 ? `€ ${comp.price.toFixed(2)}` : 'Gratis'}</span>
                </div>
              </button>
            ))}
          </div>
          {selectedComps.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border/70 bg-muted/50 p-4 text-sm">
              <p className="font-semibold">Geselecteerde competitie(s)</p>
              <p className="mt-2">Totaal te betalen: <span className="font-bold">€ {selectedComps.reduce((total, id) => {
                const comp = competitions.find(c => c.id === id)
                return total + (comp?.price ?? 0)
              }, 0).toFixed(2)}</span></p>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 text-base font-semibold"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {selectedComps.some(id => (competitions.find(c => c.id === id)?.price ?? 0) > 0)
          ? 'Registreren & testbetaling uitvoeren'
          : 'Registreren'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Heb je al een account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Meld je aan
        </Link>
      </p>
    </form>
  )
}
