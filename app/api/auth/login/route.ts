import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('Vul je e-mailadres en wachtwoord in.'), request.url)
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('Ongeldig e-mailadres of wachtwoord.'), request.url)
    )
  }

  // Check user role to redirect correctly
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single()

  // Admin emails always get admin access
  const ADMIN_EMAILS = ['tijs.peetermans@neuritas-ai.com']
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(email.toLowerCase())

  if (isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
