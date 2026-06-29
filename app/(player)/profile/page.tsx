import { createClient } from '@/utils/supabase/server'
import ProfileClient from '@/components/profile-client'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone, address, birth_date, avatar_url')
    .eq('id', user!.id)
    .single()

  return (
    <ProfileClient
      profile={{
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        email: profile?.email ?? user!.email ?? '',
        phone: profile?.phone ?? null,
        address: profile?.address ?? null,
        birth_date: profile?.birth_date ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }}
    />
  )
}
