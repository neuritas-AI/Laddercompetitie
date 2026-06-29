'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createPlayer } from '@/app/actions/admin'

export default function AddPlayerDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createPlayer(formData)
      if (res.success) {
        setOpen(false)
      } else {
        setError(res.error ?? 'Er is een fout opgetreden bij het toevoegen.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl" />}>
        <Plus className="w-4 h-4 mr-2" /> Speler Toevoegen
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nieuwe speler toevoegen</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Voornaam</Label>
              <Input id="first_name" name="first_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Achternaam</Label>
              <Input id="last_name" name="last_name" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Tijdelijk Wachtwoord</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          
          {error && <div className="text-sm font-medium text-red-500">{error}</div>}
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="font-bold">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aanmaken
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
