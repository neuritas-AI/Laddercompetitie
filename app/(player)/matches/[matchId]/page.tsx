import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function MatchDetailPage({ params }: { params: { matchId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      id,
      scheduled_date,
      location,
      status,
      score_player1,
      score_player2,
      winner_id,
      player1_id,
      player2_id,
      player1:profiles!matches_player1_id_fkey(first_name, last_name, avatar_url),
      player2:profiles!matches_player2_id_fkey(first_name, last_name, avatar_url)
    `)
    .eq('id', params.matchId)
    .single()

  if (error || !match) {
    notFound()
  }

  if (match.player1_id !== user.id && match.player2_id !== user.id) {
    notFound()
  }

  const isPlayer1 = match.player1_id === user.id
  const opponent = isPlayer1 ? match.player2 : match.player1
  const opponentProfile = Array.isArray(opponent) ? opponent[0] : opponent
  const opponentName = opponentProfile ? `${opponentProfile.first_name ?? ''} ${opponentProfile.last_name ?? ''}`.trim() || 'Tegenstander' : 'Tegenstander'

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8">
      <div className="rounded-[2rem] border border-border/50 bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">Wedstrijd</p>
        <h1 className="mt-2 text-3xl font-black">{opponentName}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Status: <span className="font-semibold text-foreground">{match.status}</span>
        </p>
        {match.scheduled_date && (
          <p className="mt-2 text-sm text-muted-foreground">
            Gepland: {new Date(match.scheduled_date).toLocaleString('nl-BE')}
          </p>
        )}
        {match.location && (
          <p className="mt-2 text-sm text-muted-foreground">Locatie: {match.location}</p>
        )}
        {(match.score_player1 || match.score_player2) && (
          <p className="mt-4 text-2xl font-black">
            {match.score_player1 ?? '?'} - {match.score_player2 ?? '?'}
          </p>
        )}
      </div>
    </div>
  )
}
