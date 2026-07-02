'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const nameHasDigits = /\d/

export default function RegisterClient({
  errorMsg,
}: {
  errorMsg?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [validationError, setValidationError] = useState<string | null>(null)

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


      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 text-base font-semibold"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Registreren
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
