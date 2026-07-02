import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getPaymentProvider } from '@/lib/payment'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const nameHasDigits = /\d/

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const first_name = (formData.get('first_name') as string)?.trim()
  const last_name = (formData.get('last_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const phone = (formData.get('phone') as string)?.trim()
  const password = formData.get('password') as string

  // Validation
  if (!first_name || !last_name || !email || !phone || !password) {
    return NextResponse.redirect(
      new URL('/register?error=' + encodeURIComponent('Alle velden zijn verplicht.'), request.url)
    )
  }

  if (nameHasDigits.test(first_name) || nameHasDigits.test(last_name)) {
    return NextResponse.redirect(
      new URL('/register?error=' + encodeURIComponent('Naam mag geen cijfers bevatten.'), request.url)
    )
  }

  if (!emailPattern.test(email)) {
    return NextResponse.redirect(
      new URL('/register?error=' + encodeURIComponent('Voer een geldig e-mailadres in.'), request.url)
    )
  }

  if (password.length < 8) {
    return NextResponse.redirect(
      new URL('/register?error=' + encodeURIComponent('Wachtwoord moet minstens 8 tekens bevatten.'), request.url)
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const adminDb = createSupabaseClient(supabaseUrl, serviceRoleKey)

  const { data: existingProfile } = await adminDb
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    return NextResponse.redirect(
      new URL('/register?error=' + encodeURIComponent('Er bestaat al een account met dit e-mailadres.'), request.url)
    )
  }

  // Step 1: Create user via Supabase Auth REST API (avoids SDK trigger issues)
  const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
      },
    }),
  })

  const userData = await createUserRes.json()

  if (!createUserRes.ok) {
    const errMsg = userData?.message || userData?.msg || 'Registratie mislukt.'
    // Handle "already registered" error
    if (errMsg.toLowerCase().includes('already registered') || errMsg.toLowerCase().includes('already been registered')) {
      return NextResponse.redirect(
        new URL('/register?error=' + encodeURIComponent('Er bestaat al een account met dit e-mailadres.'), request.url)
      )
    }
    return NextResponse.redirect(
      new URL('/register?error=' + encodeURIComponent(errMsg), request.url)
    )
  }

  const newUserId: string = userData.id

  if (!newUserId) {
    return NextResponse.redirect(
      new URL('/register?error=' + encodeURIComponent('Registratie mislukt, probeer opnieuw.'), request.url)
    )
  }

  // Step 2: Create / update profile with all data using admin client (bypasses RLS)
  await adminDb.from('profiles').upsert({
    id: newUserId,
    first_name,
    last_name,
    email,
    phone,
    role: 'player',
    is_active: true,
    share_phone: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  const { data: playerRole } = await adminDb.from('roles').select('id').eq('name', 'player').maybeSingle()
  if (playerRole?.id) {
    await adminDb.from('user_roles').upsert({ user_id: newUserId, role_id: playerRole.id }, { onConflict: 'user_id,role_id' })
  }

  const supabase = await createClient()
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !signInData.user) {
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('Registratie geslaagd, maar aanmelden mislukt. Log in met je e-mailadres.'), request.url)
    )
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
