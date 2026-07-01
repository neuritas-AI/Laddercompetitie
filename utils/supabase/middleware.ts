import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected routes here
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/matches') || request.nextUrl.pathname.startsWith('/competitions') || request.nextUrl.pathname.startsWith('/ranking') || request.nextUrl.pathname.startsWith('/profile') || request.nextUrl.pathname.startsWith('/admin')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Emails that always get admin access (fallback if DB role not yet set)
    const ADMIN_EMAILS = ['tijs.peetermans@neuritas-ai.com']
    const emailIsAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')

    // Check role from DB
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const dbIsAdmin = profile?.role === 'admin'
    const isAdmin = dbIsAdmin || emailIsAdmin

    // If email grants admin but DB doesn't yet have admin role → fix it automatically
    if (emailIsAdmin && !dbIsAdmin) {
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          role: 'admin',
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      const { data: adminRole } = await supabase.from('roles').select('id').eq('name', 'admin').maybeSingle()
      if (adminRole?.id) {
        await supabase.from('user_roles').upsert({ user_id: user.id, role_id: adminRole.id }, { onConflict: 'user_id,role_id' })
      }
    }

    // Redirect admins away from player routes, and players away from admin routes
    if (isAdminRoute && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    const isPlayerRoute =
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/competitions') ||
      request.nextUrl.pathname.startsWith('/matches') ||
      request.nextUrl.pathname.startsWith('/ranking') ||
      request.nextUrl.pathname.startsWith('/profile')
    
    if (isPlayerRoute && isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = isAdmin ? '/admin' : '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
