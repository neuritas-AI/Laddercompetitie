import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'

// These wrap frequently-needed per-user rows in React's cache() so that when the
// player layout and the page it wraps both need the same row (profile, poule
// standing) within a single request, the second call is served from cache
// instead of firing a duplicate Supabase query. Each fetcher selects the union
// of columns used by every current call site so one cached row can serve all of
// them.

export const getCachedProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone, avatar_url, share_phone, preferences')
    .eq('id', userId)
    .maybeSingle()
  return data
})

export const getCachedPoulePlayer = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('poule_players')
    .select('poule_id, position, matches_played, matches_won, matches_lost, poules(id, name)')
    .eq('player_id', userId)
    .maybeSingle()
  return data
})
