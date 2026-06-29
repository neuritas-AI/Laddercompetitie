import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const phone = formData.get('phone') as string
  const birthDate = formData.get('birth_date') as string
  const address = formData.get('address') as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  })

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/register?error=' + encodeURIComponent(error?.message || 'Registratie mislukt'), request.url))
  }

  // Update profile with extra fields
  await supabase
    .from('profiles')
    .update({ phone, birth_date: birthDate || null, address, is_active: true })
    .eq('id', data.user.id)

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
