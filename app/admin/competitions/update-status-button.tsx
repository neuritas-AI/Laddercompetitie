'use client'

import { useState, useTransition } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, Loader2 } from 'lucide-react'
import { updateCompetitionStatus } from '@/app/actions/admin'

export default function UpdateCompetitionStatusButton({ competitionId, currentStatus }: { competitionId: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleStatusChange = (status: string) => {
    if (status === currentStatus) return
    
    startTransition(async () => {
      await updateCompetitionStatus(competitionId, status)
      setOpen(false)
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-9 font-bold rounded-lg" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Status '}
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleStatusChange('draft')} className="cursor-pointer">
          Concept
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange('open')} className="cursor-pointer">
          Open voor inschrijving
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange('closed')} className="cursor-pointer">
          Gesloten
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange('finished')} className="cursor-pointer">
          Afgelopen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
