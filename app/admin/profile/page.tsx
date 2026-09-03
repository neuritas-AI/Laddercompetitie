import { createClientWithUser } from '@/utils/supabase/server'
import { getCachedProfile } from '@/lib/server-data'
import ProfileClient from '@/components/profile-client'

export default async function AdminProfilePage() {
  const { user, authError } = await createClientWithUser()
  if (authError || !user) return null

  const profile = await getCachedProfile(user.id)

  const metadata = (user?.user_metadata ?? {}) as Record<string, any>

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mijn Profiel</h1>
        <p className="text-muted-foreground">Beheer je accountgegevens en wachtwoord.</p>
      </div>
      <ProfileClient
        showNotifications={false}
        showSharePhone={false}
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
    </div>
  )
}
