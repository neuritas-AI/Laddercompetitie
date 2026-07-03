'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    if (!emailPattern.test(trimmedEmail)) {
      setError('Voer een geldig e-mailadres in.')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      // Supabase intentionally doesn't reveal whether an email address is
      // registered (to avoid leaking account existence), so any non-error
      // response here means the request was accepted successfully.
      if (resetError) {
        setError('Er ging iets mis bij het versturen van de e-mail. Probeer het later opnieuw.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Er ging iets mis bij het versturen van de e-mail. Probeer het later opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met
            instructies om je wachtwoord opnieuw in te stellen.
          </span>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Terug naar aanmelden
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="E-mailadres"
          className="h-11"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-semibold">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verstuur resetlink
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Terug naar aanmelden
        </Link>
      </p>
    </form>
  )
}
