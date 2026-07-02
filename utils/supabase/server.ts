import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Safe helper that returns the supabase client and a user when possible.
export async function createClientWithUser() {
  const supabase = await createClient()
  try {
    const res = await supabase.auth.getUser()
    // result shape may include error
    const user = res?.data?.user ?? null
    return { supabase, user, authError: res?.error ?? null }
  } catch (err) {
    // If auth throws (invalid refresh token etc.), return null user but keep client
    return { supabase, user: null, authError: err }
  }
}
