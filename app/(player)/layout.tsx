import { createClientWithUser } from '@/utils/supabase/server'
import { getCachedProfile, getCachedPoulePlayer } from '@/lib/server-data'
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

  const [profile, pouleInfo, { data: notifs }] = await Promise.all([
    getCachedProfile(user.id),
    getCachedPoulePlayer(user.id),
    supabase
      .from('notifications')
      .select('id, title, message, type, is_read, link_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const displayName = getDisplayName(profile ?? { email: user?.email ?? '' }) || user?.email?.split('@')[0] || 'Profiel'
  const pouleLabel = (pouleInfo?.poules as any)?.name ?? null
  const notifications = notifs || []

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
