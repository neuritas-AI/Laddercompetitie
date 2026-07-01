'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, Ban, Trash2, UserCheck, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deactivatePlayer, blockPlayer, deletePlayer } from '@/app/actions/admin'

export function PlayerActions({ playerId, playerName }: { playerId: string; playerName: string }) {
  const [open, setOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'deactivate' | 'block' | 'delete' | null>(null)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function confirm(action: 'deactivate' | 'block' | 'delete') {
    setPendingAction(action)
    setOpen(true)
  }

  function handleConfirm() {
    if (!pendingAction) return

    startTransition(async () => {
      let result
      if (pendingAction === 'deactivate') {
        result = await deactivatePlayer(playerId)
      } else if (pendingAction === 'block') {
        result = await blockPlayer(playerId, reason)
      } else {
        result = await deletePlayer(playerId)
      }

      if (result.success) {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon" aria-label={`Acties voor ${playerName}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => confirm('deactivate')}>
            <UserCheck className="mr-2 h-4 w-4" /> Deactiveren
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => confirm('block')}>
            <Ban className="mr-2 h-4 w-4" /> Blokkeren
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => confirm('delete')} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" /> Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'delete'
                ? 'Speler verwijderen?'
                : pendingAction === 'block'
                  ? 'Speler blokkeren?'
                  : 'Speler deactiveren?'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'delete'
                ? `Je staat op het punt ${playerName} te verwijderen. Historische wedstrijdresultaten blijven behouden.`
                : pendingAction === 'block'
                  ? `Je staat op het punt ${playerName} te blokkeren.`
                  : `Je staat op het punt ${playerName} te deactiveren.`}
            </DialogDescription>
          </DialogHeader>
          {pendingAction === 'block' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reden (optioneel)</Label>
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Bijvoorbeeld: misconduct" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} type="button">
              Annuleren
            </Button>
            <Button onClick={handleConfirm} disabled={isPending} className="font-bold">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Bevestigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
