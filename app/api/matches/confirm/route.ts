import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { scoreId, action, note } = await request.json()

  // Confirm action
  const { error } = await supabase.from('match_confirmations').insert({
    score_id: scoreId,
    confirmed_by: user.id,
    action,
    note: note || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update match_scores status
  await supabase
    .from('match_scores')
    .update({ status: action === 'approved' ? 'confirmed' : 'disputed' })
    .eq('id', scoreId)

  if (action === 'approved') {
    // Update match to confirmed
    const { data: score } = await supabase.from('match_scores').select('match_id, submitted_by').eq('id', scoreId).single()
    if (score) {
      await supabase.from('matches').update({ status: 'confirmed' }).eq('id', score.match_id)
      // Notify submitter
      await supabase.from('notifications').insert({
        user_id: score.submitted_by,
        title: 'Score bevestigd',
        message: 'Je tegenstander heeft de score goedgekeurd.',
        type: 'score_confirmed',
      })
    }
  }

  return NextResponse.json({ success: true })
}
