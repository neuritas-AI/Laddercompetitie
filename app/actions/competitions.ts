'use server'

import { revalidatePath } from 'next/cache'
import { createClientWithUser } from '@/utils/supabase/server'
import { getPaymentProvider } from '@/lib/payment'

export type ActionResponse = {
  success: boolean
  error?: string
  registrationId?: string
}

export async function enrollInCompetition(competitionId: string): Promise<ActionResponse> {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) {
    return { success: false, error: 'Niet ingelogd.' }
  }

  const { data: competition, error: compError } = await supabase
    .from('competitions')
    .select('id, name, status, max_participants, price')
    .eq('id', competitionId)
    .single()

  if (compError || !competition) {
    return { success: false, error: 'Competitie niet gevonden.' }
  }

  if (competition.status !== 'open') {
    return { success: false, error: 'Deze competitie is niet open voor inschrijving.' }
  }

  const { data: existing } = await supabase
    .from('competition_registrations')
    .select('id, status')
    .eq('competition_id', competitionId)
    .eq('player_id', user.id)
    .maybeSingle()

  if (existing) {
    return { success: true, registrationId: existing.id }
  }

  if (competition.max_participants) {
    const { count } = await supabase
      .from('competition_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('competition_id', competitionId)
      .neq('status', 'cancelled')

    if (count !== null && count >= competition.max_participants) {
      return { success: false, error: 'Deze competitie is vol.' }
    }
  }

  const { data: registration, error } = await supabase
    .from('competition_registrations')
    .insert({
      competition_id: competitionId,
      player_id: user.id,
      status: 'registered',
      amount: competition.price ?? 0,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/competitions')
  revalidatePath('/dashboard')

  return { success: true, registrationId: registration.id }
}

export async function completeTestPayment(competitionId: string): Promise<ActionResponse> {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) {
    return { success: false, error: 'Niet ingelogd.' }
  }

  const { data: competition } = await supabase
    .from('competitions')
    .select('id, name, price')
    .eq('id', competitionId)
    .single()

  if (!competition) {
    return { success: false, error: 'Competitie niet gevonden.' }
  }

  let { data: registration } = await supabase
    .from('competition_registrations')
    .select('id, status')
    .eq('competition_id', competitionId)
    .eq('player_id', user.id)
    .maybeSingle()

  if (!registration) {
    const enrollResult = await enrollInCompetition(competitionId)
    if (!enrollResult.success) return enrollResult

    const { data: newReg } = await supabase
      .from('competition_registrations')
      .select('id, status')
      .eq('competition_id', competitionId)
      .eq('player_id', user.id)
      .single()

    registration = newReg
  }

  if (registration?.status === 'paid_test' || registration?.status === 'paid') {
    return { success: true, registrationId: registration.id }
  }

  const provider = getPaymentProvider('test')
  const paymentResult = await provider.processPayment({
    amount: Number(competition.price ?? 0),
    userId: user.id,
    competitionId,
    description: `Inschrijving ${competition.name}`,
  })

  if (!paymentResult.success) {
    return { success: false, error: paymentResult.error ?? 'Betaling mislukt.' }
  }

  const { error: updateError } = await supabase
    .from('competition_registrations')
    .update({
      status: 'paid_test',
      payment_provider: paymentResult.provider,
      payment_reference: paymentResult.paymentId,
      amount: competition.price ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', registration!.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath('/competitions')
  revalidatePath('/dashboard')

  return { success: true, registrationId: registration!.id }
}

// Completes payment for a doubles registration the current user is already
// part of (e.g. one an admin created on the team's behalf, or their own team
// registration that's stuck in 'registered' for any other reason). Unlike
// enrollInCompetition/completeTestPayment (singles), this never creates a new
// registration — the team must already be registered.
export async function completeTeamTestPayment(competitionId: string): Promise<ActionResponse> {
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) {
    return { success: false, error: 'Niet ingelogd.' }
  }

  const { data: competition } = await supabase
    .from('competitions')
    .select('id, name, price')
    .eq('id', competitionId)
    .single()

  if (!competition) {
    return { success: false, error: 'Competitie niet gevonden.' }
  }

  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('player_id', user.id)

  const teamIds = (memberships ?? []).map((m) => m.team_id)
  if (teamIds.length === 0) {
    return { success: false, error: 'Geen teaminschrijving gevonden voor deze competitie.' }
  }

  const { data: registration } = await supabase
    .from('competition_team_registrations')
    .select('id, status')
    .eq('competition_id', competitionId)
    .in('team_id', teamIds)
    .maybeSingle()

  if (!registration) {
    return { success: false, error: 'Geen teaminschrijving gevonden voor deze competitie.' }
  }

  if (registration.status === 'paid_test' || registration.status === 'paid') {
    return { success: true, registrationId: registration.id }
  }

  const provider = getPaymentProvider('test')
  const paymentResult = await provider.processPayment({
    amount: Number(competition.price ?? 0),
    userId: user.id,
    competitionId,
    description: `Inschrijving dubbel ${competition.name}`,
  })

  if (!paymentResult.success) {
    return { success: false, error: paymentResult.error ?? 'Betaling mislukt.' }
  }

  const { error: updateError } = await supabase
    .from('competition_team_registrations')
    .update({
      status: 'paid_test',
      payment_provider: paymentResult.provider,
      payment_reference: paymentResult.paymentId,
      amount: competition.price ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', registration.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath('/competitions')
  revalidatePath('/dashboard')

  return { success: true, registrationId: registration.id }
}
