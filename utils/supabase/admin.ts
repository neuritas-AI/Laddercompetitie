import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClientWithUser } from './server'

const ADMIN_EMAILS = ['tijs.peetermans@neuritas-ai.com']

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Verifies the current session belongs to an admin and, if so, returns a
// service-role client. Admin pages should read through this instead of the
// RLS-scoped client: several tables (e.g. competition_team_registrations)
// have no "admin can view all" policy, and relying on profiles.role staying
// perfectly in sync with the app's admin check (which also allows a
// hardcoded email fallback, see ensureAdmin in app/actions/admin.ts) is
// fragile. Returns null if the caller isn't an admin.
export async function requireAdminClient() {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) return null

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const emailIsAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')
  const dbIsAdmin = data?.role === 'admin'

  if (!dbIsAdmin && !emailIsAdmin) return null

  return createAdminClient()
}
