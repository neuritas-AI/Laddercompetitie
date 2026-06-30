'use client'

import { useState, useTransition } from 'react'
import { ShieldAlert, Loader2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { createAdmin } from '@/app/actions/admin'

export default function AddAdminDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function onSubmit(formData: FormData) {
    setError(null)
    setTempPassword(null)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    
    if (!name || !email) {
      setError('Vul alle velden in.')
      return
    }

    startTransition(async () => {
      const res = await createAdmin(formData)
      if (res.success) {
        if (res.tempPassword) {
          setTempPassword(res.tempPassword)
        } else {
          setOpen(false)
        }
      } else {
        setError(res.error ?? 'Er is een fout opgetreden.')
      }
    })
  }

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setTempPassword(null)
      setOpen(val)
    }}>
      <DialogTrigger render={<Button className="flex items-center bg-primary hover:bg-primary/90 text-white font-bold rounded-xl" />}>
        <ShieldAlert className="w-4 h-4 mr-2" /> Admin Toevoegen
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Administrator Toevoegen</DialogTitle>
          <DialogDescription>
            {tempPassword ? 'Administrator succesvol aangemaakt.' : 'Maak een nieuw administrator account aan. Deze persoon wordt GEEN speler.'}
          </DialogDescription>
        </DialogHeader>
        
        {tempPassword ? (
          <div className="space-y-4 pt-4">
            <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200 text-sm">
              Account succesvol aangemaakt! Geef het onderstaande tijdelijke wachtwoord veilig door aan de nieuwe beheerder.
            </div>
            <div className="space-y-2">
              <Label>Tijdelijk Wachtwoord</Label>
              <div className="flex items-center gap-2">
                <Input value={tempPassword} readOnly className="font-mono bg-muted" />
                <Button variant="outline" size="icon" onClick={handleCopy} type="button">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={() => setOpen(false)} className="w-full">Sluiten</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={onSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Volledige Naam</Label>
              <Input id="name" name="name" required placeholder="bijv. Jan Peeters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input id="email" name="email" type="email" required placeholder="bijv. jan@club.be" />
            </div>

            {error && <div className="text-sm font-medium text-red-500">{error}</div>}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="font-bold">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Account Aanmaken
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
