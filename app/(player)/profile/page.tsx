import { createClientWithUser } from '@/utils/supabase/server'
import { getCachedProfile } from '@/lib/server-data'
import ProfileClient from '@/components/profile-client'

export default async function ProfilePage() {
  const { user, authError } = await createClientWithUser()
  if (authError || !user) return null

  const profile = await getCachedProfile(user.id)

  const metadata = (user?.user_metadata ?? {}) as Record<string, any>

  return (
    <ProfileClient
      profile={{
        first_name: profile?.first_name ?? metadata.first_name ?? null,
        last_name: profile?.last_name ?? metadata.last_name ?? null,
        email: profile?.email ?? user!.email ?? '',
        phone: profile?.phone ?? null,
        avatar_url: profile?.avatar_url ?? null,
        share_phone: profile?.share_phone ?? false,
        preferences: profile?.preferences ?? {},
      }}
    />
  )
}
