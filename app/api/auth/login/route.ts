import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    // Redirect back to login with error
    return NextResponse.redirect(new URL('/login?error=Ongeldige inloggegevens', request.url))
  }

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
