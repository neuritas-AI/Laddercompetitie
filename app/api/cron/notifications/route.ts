import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// We use the admin client to bypass RLS since this is a background job
export async function GET(request: Request) {
  // Check authorization header for a cron secret (if set)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // 1. Find matches scheduled for tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const endOfTomorrow = new Date(tomorrow)
  endOfTomorrow.setHours(23, 59, 59, 999)

  const { data: matchesTomorrow, error: errTomorrow } = await supabase
    .from('matches')
    .select('id, player1_id, player2_id, scheduled_date')
    .gte('scheduled_date', tomorrow.toISOString())
    .lte('scheduled_date', endOfTomorrow.toISOString())

  if (!errTomorrow && matchesTomorrow) {
    for (const match of matchesTomorrow) {
      const matchUrl = `/matches/${match.id}`
      
      // Notify player 1
      await sendDbNotification(supabase, match.player1_id, 'Wedstrijd morgen', 'Vergeet je wedstrijd niet die morgen gepland staat!', 'match_tomorrow', matchUrl)
      // Notify player 2
      await sendDbNotification(supabase, match.player2_id, 'Wedstrijd morgen', 'Vergeet je wedstrijd niet die morgen gepland staat!', 'match_tomorrow', matchUrl)
    }
  }

  // 2. Find matches scheduled for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const endOfToday = new Date(today)
  endOfToday.setHours(23, 59, 59, 999)

  const { data: matchesToday, error: errToday } = await supabase
    .from('matches')
    .select('id, player1_id, player2_id, scheduled_date')
    .gte('scheduled_date', today.toISOString())
    .lte('scheduled_date', endOfToday.toISOString())

  if (!errToday && matchesToday) {
    for (const match of matchesToday) {
      const matchUrl = `/matches/${match.id}`
      
      // Notify player 1
      await sendDbNotification(supabase, match.player1_id, 'Wedstrijd Vandaag!', 'Je hebt vandaag een wedstrijd gepland staan. Veel succes!', 'match_today', matchUrl)
      // Notify player 2
      await sendDbNotification(supabase, match.player2_id, 'Wedstrijd Vandaag!', 'Je hebt vandaag een wedstrijd gepland staan. Veel succes!', 'match_today', matchUrl)
    }
  }

  return NextResponse.json({ success: true, message: 'Cron job executed' })
}

async function sendDbNotification(supabase: any, userId: string, title: string, message: string, type: string, linkUrl: string) {
  // Check preferences
  const { data: profile } = await supabase.from('profiles').select('preferences').eq('id', userId).single()
  const notificationsOptIn = profile?.preferences?.notifications || []
  
  if (profile?.preferences?.notifications && !notificationsOptIn.includes(type)) {
    return // User opted out
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    link_url: linkUrl,
    is_read: false
  })
}
