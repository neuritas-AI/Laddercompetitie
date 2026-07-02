import { createClientWithUser } from '@/utils/supabase/server'
import { getDisplayName } from '@/lib/profile'
import PlayerLayoutClient from '@/components/player-layout-client'

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, authError } = await createClientWithUser()

  // If an auth error occurred (invalid/missing refresh token), treat as not authenticated
  if (authError || !user) {
    return (
      <PlayerLayoutClient
        displayName={'Profiel'}
        avatarUrl={null}
        pouleLabel={null}
        notifications={[]}
      >
        {children}
      </PlayerLayoutClient>
    )
  }

  let profile = null
  let pouleInfo = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, email')
      .eq('id', user.id)
      .maybeSingle()
    profile = data

    const { data: pp } = await supabase
      .from('poule_players')
      .select('position, poules(name)')
      .eq('player_id', user.id)
      .maybeSingle()
    pouleInfo = pp
  }

  const displayName = getDisplayName(profile ?? { email: user?.email ?? '' }) || user?.email?.split('@')[0] || 'Profiel'
  const pouleLabel = (pouleInfo?.poules as any)?.name ?? null

  let notifications: any[] = []
  if (user) {
    const { data: notifs } = await supabase
      .from('notifications')
      .select('id, title, message, type, is_read, link_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    notifications = notifs || []
  }

  return (
    <PlayerLayoutClient
      displayName={displayName}
      avatarUrl={profile?.avatar_url ?? null}
      pouleLabel={pouleLabel}
      notifications={notifications}
    >
      {children}
    </PlayerLayoutClient>
  )
}
