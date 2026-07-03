'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function ResetPasswordClient() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    // Clicking the reset link lands here with a recovery session already
    // established by the Supabase client (it detects the token in the URL on
    // load). Check for it directly, and also listen for the PASSWORD_RECOVERY
    // event in case it fires just after this effect mounts.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) setHasSession(true)
      setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true)
        setChecking(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Wachtwoord moet minstens 8 tekens bevatten.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('De wachtwoorden komen niet overeen.')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

      if (updateError) {
        setError('Deze resetlink is ongeldig of verlopen. Vraag een nieuwe resetlink aan.')
        setHasSession(false)
        return
      }

      await supabase.auth.signOut()
      setSuccess(true)
      setTimeout(() => {
        router.push('/login?success=' + encodeURIComponent('Wachtwoord gewijzigd. Je kan nu aanmelden.'))
      }, 1500)
    } catch {
      setError('Er ging iets mis. Probeer het later opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Wachtwoord succesvol gewijzigd! Je wordt doorgestuurd naar de aanmeldpagina...</span>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Deze resetlink is ongeldig of verlopen. Vraag een nieuwe resetlink aan.</span>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
            Nieuwe resetlink aanvragen
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
        <Label htmlFor="new_password">Nieuw wachtwoord</Label>
        <Input
          id="new_password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Minimaal 8 tekens"
          className="h-11"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Bevestig wachtwoord</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-semibold">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Wachtwoord wijzigen
      </Button>
    </form>
  )
}
