import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

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

// auth.getUser() makes a network round-trip to Supabase to revalidate the JWT.
// Layouts and the pages they wrap each call createClientWithUser(), which would
// otherwise repeat that round-trip multiple times for a single request. React's
// cache() memoizes the result per request so it only happens once.
const getAuthedUser = cache(async () => {
  const supabase = await createClient()
  try {
    const res = await supabase.auth.getUser()
    return { user: res?.data?.user ?? null, authError: res?.error ?? null }
  } catch (err) {
    return { user: null, authError: err }
  }
})

// Safe helper that returns the supabase client and a user when possible.
export async function createClientWithUser() {
  const supabase = await createClient()
  const { user, authError } = await getAuthedUser()
  return { supabase, user, authError }
}
