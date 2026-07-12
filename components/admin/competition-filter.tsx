'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Competition = { id: string; name: string }

export default function CompetitionFilter({
  competitions,
  selected,
}: {
  competitions: Competition[]
  selected: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (rawValue: unknown) => {
    const value = String(rawValue ?? '')
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || !value) {
      params.delete('competition')
    } else {
      params.set('competition', value)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-4 py-3 shadow-sm w-fit">
      <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm font-medium text-muted-foreground shrink-0">Competitie</span>
      <Select value={selected || 'all'} onValueChange={handleChange}>
        <SelectTrigger className="h-9 min-w-[220px]">
          <SelectValue placeholder="Alle competities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle competities</SelectItem>
          {competitions.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
