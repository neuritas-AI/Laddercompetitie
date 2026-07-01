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
  const competitionIds = formData.getAll('competitions') as string[]

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

  // Step 3: Link chosen competitions and handle test payment for selected competition costs
  if (competitionIds.length > 0) {
    const { data: competitionsData, error: competitionError } = await adminDb
      .from('competitions')
      .select('id, name, status, price')
      .in('id', competitionIds)

    if (competitionError || !competitionsData) {
      return NextResponse.redirect(
        new URL('/register?error=' + encodeURIComponent('Fout bij het ophalen van competities.'), request.url)
      )
    }

    const missingCompetitions = competitionIds.filter(id => !competitionsData.some(c => c.id === id))
    if (missingCompetitions.length > 0) {
      return NextResponse.redirect(
        new URL('/register?error=' + encodeURIComponent('Een of meer geselecteerde competities zijn niet gevonden.'), request.url)
      )
    }

    const closedCompetition = competitionsData.find(c => c.status !== 'open')
    if (closedCompetition) {
      return NextResponse.redirect(
        new URL('/register?error=' + encodeURIComponent('Een geselecteerde competitie is niet open voor inschrijving.'), request.url)
      )
    }

    const totalAmount = competitionsData.reduce((sum, comp) => sum + Number(comp.price ?? 0), 0)

    const registrations = competitionsData.map(comp => ({
      competition_id: comp.id,
      player_id: newUserId,
      status: 'registered',
      amount: Number(comp.price ?? 0),
    }))

    const { error: registrationError } = await adminDb
      .from('competition_registrations')
      .upsert(registrations, { onConflict: 'competition_id,player_id', ignoreDuplicates: true })

    if (registrationError) {
      return NextResponse.redirect(
        new URL('/register?error=' + encodeURIComponent('Inschrijving mislukt. Probeer het opnieuw.'), request.url)
      )
    }

    if (totalAmount > 0) {
      const provider = getPaymentProvider('test')
      const paymentResult = await provider.processPayment({
        amount: totalAmount,
        userId: newUserId,
        competitionId: competitionIds.join(','),
        description: `Testbetaling voor competitie-inschrijving`,
      })

      if (!paymentResult.success) {
        return NextResponse.redirect(
          new URL('/register?error=' + encodeURIComponent(paymentResult.error ?? 'Testbetaling mislukt.'), request.url)
        )
      }

      const { error: updateError } = await adminDb
        .from('competition_registrations')
        .update({
          status: 'paid_test',
          payment_provider: paymentResult.provider,
          payment_reference: paymentResult.paymentId,
          amount: totalAmount,
          updated_at: new Date().toISOString(),
        })
        .in('competition_id', competitionIds)
        .eq('player_id', newUserId)

      if (updateError) {
        return NextResponse.redirect(
          new URL('/register?error=' + encodeURIComponent('Registratie bijgewerkt, maar betaling kon niet voltooid worden.'), request.url)
        )
      }
    }
  }

  return NextResponse.redirect(new URL('/register?success=1', request.url))
}
