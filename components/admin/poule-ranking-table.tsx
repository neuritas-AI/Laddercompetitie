'use client'

import { useState } from 'react'
import { ListOrdered } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MovePlayerDialog from '@/components/admin/move-player-dialog'
import RemovePlayerFromPouleButton from '@/components/admin/remove-player-from-poule-button'

export type PouleRankingRow = {
  key: string
  kind: 'player' | 'team'
  playerId: string | null
  position: number
  name: string
  avatarUrl: string | null
  played: number
  won: number
  lost: number
  points: number
}

export default function PouleRankingTable({
  pouleId,
  initialRows,
  destinationPoules,
}: {
  pouleId: string
  initialRows: PouleRankingRow[]
  destinationPoules: { id: string; name: string }[]
}) {
  // Rows are derived from props (the server-provided truth) rather than mirrored
  // into state, so a background router.refresh() naturally flows through without
  // needing an effect to resync. `removedIds` is only a short-lived optimistic
  // overlay: it hides a row the instant a removal succeeds, before the refreshed
  // server data (which will no longer include that row at all) arrives.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const rows = initialRows.filter((row) => !row.playerId || !removedIds.has(row.playerId))

  const handleRemoved = (playerId: string) => {
    setRemovedIds((prev) => new Set(prev).add(playerId))
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/50">
        <CardTitle className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-primary" />
          Rangschikking ({rows.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {rows.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                <th className="px-5 py-3 font-bold">Positie</th>
                <th className="px-5 py-3 font-bold">Speler / Team</th>
                <th className="px-5 py-3 font-bold">Gespeeld</th>
                <th className="px-5 py-3 font-bold">W-V</th>
                <th className="px-5 py-3 font-bold">Punten</th>
                <th className="px-5 py-3 font-bold text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.map((row) => (
                <tr key={row.key} className="hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                      {row.position}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {row.kind === 'player' && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                          {row.avatarUrl
                            ? <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">{row.name.charAt(0)}</div>
                          }
                        </div>
                      )}
                      <span className="font-semibold text-foreground">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{row.played}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.won}-{row.lost}</td>
                  <td className="px-5 py-3 font-black text-foreground">{row.points}</td>
                  <td className="px-5 py-3">
                    {row.kind === 'player' && row.playerId && (
                      <div className="flex items-center justify-end gap-2">
                        <MovePlayerDialog player={{ id: row.playerId, name: row.name }} poules={destinationPoules} currentPouleId={pouleId} />
                        <RemovePlayerFromPouleButton
                          playerId={row.playerId}
                          pouleId={pouleId}
                          onRemoved={() => handleRemoved(row.playerId!)}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ListOrdered className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-bold text-muted-foreground">Geen spelers of teams in deze poule</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
