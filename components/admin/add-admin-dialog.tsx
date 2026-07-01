'use client'

import { useState, useTransition } from 'react'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { createAdmin } from '@/app/actions/admin'

export default function AddAdminDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    setSuccessMessage(null)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (!name || !email || !password || !confirmPassword) {
      setError('Vul alle velden in.')
      return
    }

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.')
      return
    }

    if (password.length < 8) {
      setError('Wachtwoord moet minstens 8 tekens bevatten.')
      return
    }

    startTransition(async () => {
      const res = await createAdmin(formData)
      if (res.success) {
        setSuccessMessage('Administrator succesvol aangemaakt. De nieuwe beheerder kan nu inloggen.')
        setTimeout(() => {
          setOpen(false)
          setSuccessMessage(null)
        }, 1500)
      } else {
        setError(res.error ?? 'Er is een fout opgetreden.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
      <DialogTrigger render={<Button className="flex items-center bg-primary hover:bg-primary/90 text-white font-bold rounded-xl" />}>
        <ShieldAlert className="w-4 h-4 mr-2" /> Admin Toevoegen
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Administrator Toevoegen</DialogTitle>
          <DialogDescription>
            Maak een nieuw administrator account aan. Deze persoon wordt GEEN speler.
          </DialogDescription>
        </DialogHeader>

        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Volledige Naam</Label>
            <Input id="name" name="name" required placeholder="Naam" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input id="email" name="email" type="email" required placeholder="E-mailadres" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input id="password" name="password" type="password" required placeholder="Wachtwoord" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Bevestig wachtwoord</Label>
              <Input id="confirm_password" name="confirm_password" type="password" required placeholder="Herhaal wachtwoord" />
            </div>
          </div>

          {error && <div className="text-sm font-medium text-red-500">{error}</div>}
          {successMessage && <div className="text-sm font-medium text-green-600">{successMessage}</div>}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="font-bold">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Account Aanmaken
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
