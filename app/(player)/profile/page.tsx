import { createClient } from '@/utils/supabase/server'
import ProfileClient from '@/components/profile-client'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone, avatar_url, share_phone, preferences')
    .eq('id', user!.id)
    .maybeSingle()

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
