import { createClient } from '@/utils/supabase/server'
import { getDisplayName } from '@/lib/profile'
import AdminLayoutClient from '@/components/admin-layout-client'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let adminName = 'Beheerder'
  let adminEmail = ''

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single()

    if (profile) {
      adminName = getDisplayName(profile)
      adminEmail = profile.email
    }
  }

  return (
    <AdminLayoutClient adminName={adminName} adminEmail={adminEmail}>
      {children}
    </AdminLayoutClient>
  )
}
