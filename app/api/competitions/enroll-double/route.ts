import { NextResponse } from 'next/server'
import { createClientWithUser } from '@/utils/supabase/server'
import { getPaymentProvider } from '@/lib/payment'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { competitionId, partnerId, teamName } = await request.json()
  if (!competitionId || !partnerId) return NextResponse.json({ error: 'Ontbrekende velden' }, { status: 400 })

  if (partnerId === user.id) return NextResponse.json({ error: 'Je kan niet jezelf als partner kiezen.' }, { status: 400 })

  // Validate competition
  const { data: competition } = await supabase.from('competitions').select('id, type, price, status').eq('id', competitionId).single()
  if (!competition) return NextResponse.json({ error: 'Competitie niet gevonden' }, { status: 404 })
  if (!competition.type.startsWith('double')) return NextResponse.json({ error: 'Competitie is geen dubbelcompetitie' }, { status: 400 })
  if (competition.status !== 'open') return NextResponse.json({ error: 'Competitie niet open' }, { status: 400 })

  // Check partner exists and is active
  const { data: partner } = await supabase.from('profiles').select('id, first_name, last_name').eq('id', partnerId).eq('is_active', true).maybeSingle()
  if (!partner) return NextResponse.json({ error: 'Gekozen partner niet gevonden of niet actief' }, { status: 404 })

  // Ensure neither player is already in a team registered for this competition
  const { data: existing } = await supabase.from('team_members').select('team_id, player_id').or(`player_id.eq.${user.id},player_id.eq.${partnerId}`)

  // Check if any of these teams is already registered for this competition
  if (existing && existing.length > 0) {
    for (const row of existing) {
      const { data: teamReg } = await supabase.from('competition_team_registrations').select('id').eq('competition_id', competitionId).eq('team_id', row.team_id).maybeSingle()
      if (teamReg) {
        return NextResponse.json({ error: 'Een van de spelers zit al in een team dat voor deze competitie ingeschreven is.' }, { status: 400 })
      }
    }
  }

  // Create a new team for this competition and add both members.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const adminDb = createSupabaseClient(supabaseUrl, serviceRoleKey)

  const defaultName = teamName || `Team ${user.id.substring(0,4)} & ${partnerId.substring(0,4)}`
  const { data: newTeam, error: teamError } = await adminDb.from('teams').insert({ competition_id: competitionId, name: defaultName }).select().single()
  if (teamError || !newTeam) return NextResponse.json({ error: teamError?.message || 'Kon team niet aanmaken' }, { status: 500 })

  const { error: membersError } = await adminDb.from('team_members').insert([
    { team_id: newTeam.id, player_id: user.id },
    { team_id: newTeam.id, player_id: partnerId },
  ])
  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 })

  // Register the team for the competition
  const { data: registration, error: regError } = await supabase.from('competition_team_registrations').insert({
    competition_id: competitionId,
    team_id: newTeam.id,
    status: 'registered',
    amount: competition.price ?? 0,
  }).select().single()

  if (regError) return NextResponse.json({ error: regError.message }, { status: 500 })

  // Process test payment
  const provider = getPaymentProvider('test')
  const paymentResult = await provider.processPayment({
    amount: Number(competition.price ?? 0),
    userId: user.id,
    competitionId,
    description: `Inschrijving dubbel ${competitionId}`,
  })

  if (!paymentResult.success) {
    return NextResponse.json({ error: paymentResult.error ?? 'Betaling mislukt' }, { status: 500 })
  }

  const { error: updateRegError } = await supabase.from('competition_team_registrations').update({
    status: 'paid_test',
    payment_provider: paymentResult.provider,
    payment_reference: paymentResult.paymentId,
    amount: competition.price ?? 0,
    updated_at: new Date().toISOString(),
  }).eq('id', registration.id)

  if (updateRegError) return NextResponse.json({ error: updateRegError.message }, { status: 500 })

  return NextResponse.json({ success: true, teamId: newTeam.id, registrationId: registration.id })
}
