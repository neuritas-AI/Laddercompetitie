import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ConfirmMatchForm from '@/components/confirm-match-form'

interface Params {
  params: {
    matchId: string
  }
}

export default async function MatchConfirmPage({ params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(
      `id, player1_id, player2_id, status, player1:profiles!matches_player1_id_fkey(first_name, last_name), player2:profiles!matches_player2_id_fkey(first_name, last_name)`
    )
    .eq('id', params.matchId)
    .single()

  if (matchError || !match) {
    notFound()
  }

  if (match.player1_id !== user.id && match.player2_id !== user.id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="rounded-[2rem] border border-border/50 bg-card p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold">Geen toegang</h1>
          <p className="mt-4 text-muted-foreground">Je hebt geen toegang om deze score te bevestigen.</p>
        </div>
      </div>
    )
  }

  const player1 = Array.isArray(match.player1) ? match.player1[0] : match.player1
  const player2 = Array.isArray(match.player2) ? match.player2[0] : match.player2

  const { data: score, error: scoreError } = await supabase
    .from('match_scores')
    .select('id, p1_score, p2_score, submitted_by, status')
    .eq('match_id', params.matchId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (scoreError) {
    console.error('MatchConfirmPage score query error:', scoreError)
    notFound()
  }

  if (!score) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="rounded-[2rem] border border-border/50 bg-card p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold">Geen score om te bevestigen</h1>
          <p className="mt-4 text-muted-foreground">Er staat momenteel geen openstaande score voor deze wedstrijd klaar.</p>
        </div>
      </div>
    )
  }

  if (score.submitted_by === user.id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="rounded-[2rem] border border-border/50 bg-card p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold">Score is al ingevoerd</h1>
          <p className="mt-4 text-muted-foreground">Je hebt deze score ingevoerd. Je tegenstander moet deze bevestigen of betwisten.</p>
        </div>
      </div>
    )
  }

  const isPlayer1 = match.player1_id === user.id
  const opponent = isPlayer1 ? player2 : player1
  const opponentName = opponent ? `${opponent.first_name ?? ''} ${opponent.last_name ?? ''}`.trim() : 'Tegenstander'
  const scoreLine = `${score.p1_score} – ${score.p2_score}`

  return (
    <div className="min-h-[60vh] p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-6">Score bevestiging</h1>
        <ConfirmMatchForm matchId={score.id} opponentName={opponentName} scoreLine={scoreLine} />
      </div>
    </div>
  )
}
