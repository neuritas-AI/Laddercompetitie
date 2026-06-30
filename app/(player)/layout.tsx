import Link from 'next/link'
import { CalendarDays, User, LogOut, Home, ListOrdered } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import PlayerLayoutClient from '@/components/player-layout-client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'Home' as const },
  { href: '/matches', label: 'Wedstrijden', icon: 'CalendarDays' as const },
  { href: '/ranking', label: 'Rangschikking', icon: 'ListOrdered' as const },
  { href: '/profile', label: 'Profiel', icon: 'User' as const },
]

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let pouleInfo = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, email')
      .eq('id', user.id)
      .single()
    profile = data

    // Get poule info for this user
    const { data: pp } = await supabase
      .from('poule_players')
      .select('position, poules(name)')
      .eq('player_id', user.id)
      .maybeSingle()
    pouleInfo = pp
  }

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
    : 'Speler'

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
