'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export type ActionResponse = {
  success: boolean
  error?: string
}

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const ADMIN_EMAILS = ['tijs.peetermans@neuritas-ai.com']

// Ensure the user is an admin
async function ensureAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not logged in')

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  const emailIsAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')
  const dbIsAdmin = data?.role === 'admin'

  if (!dbIsAdmin && !emailIsAdmin) {
    throw new Error('Unauthorized')
  }

  const adminSupabase = getAdminClient()

  // Auto-fix the role in the database if needed
  if (emailIsAdmin && !dbIsAdmin) {
    await adminSupabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
  }

  return { supabase: adminSupabase, user }
}

// ─── COMPETITIONS ────────────────────────────────────────────────────────────

export async function createCompetition(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const season_year = parseInt(formData.get('season_year') as string, 10)
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string
    const status = (formData.get('status') as string) || 'draft'
    const max_participants = parseInt(formData.get('max_participants') as string, 10) || 32

    if (!name || !type || !season_year || !start_date || !end_date) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }

    const { error } = await supabase.from('competitions').insert({
      name,
      type,
      season_year,
      start_date,
      end_date,
      status,
      max_participants,
      is_active: status === 'open',
    })

    if (error) throw error

    revalidatePath('/admin/competitions')
    return { success: true }
  } catch (error: any) {
    console.error('createCompetition error:', error)
    const msg = error?.message || JSON.stringify(error)
    return { success: false, error: msg || 'Onbekende fout' }
  }
}

export async function updateCompetitionStatus(
  competitionId: string,
  status: string
): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    const { error } = await supabase
      .from('competitions')
      .update({
        status,
        is_active: status === 'open',
      })
      .eq('id', competitionId)

    if (error) throw error

    revalidatePath('/admin/competitions')
    return { success: true }
  } catch (error: any) {
    console.error('updateCompetitionStatus error:', error)
    const msg = error?.message || JSON.stringify(error)
    return { success: false, error: msg || 'Onbekende fout' }
  }
}

export async function updateCompetition(id: string, formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const season_year = parseInt(formData.get('season_year') as string, 10)
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string
    const status = formData.get('status') as string
    const max_participants = parseInt(formData.get('max_participants') as string, 10)

    if (!name || !type || isNaN(season_year) || !start_date || !end_date) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }

    const { error } = await supabase
      .from('competitions')
      .update({ name, type, season_year, start_date, end_date, status, max_participants: isNaN(max_participants) ? null : max_participants })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/competitions')
    return { success: true }
  } catch (error: any) {
    console.error('updateCompetition error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

export async function deleteCompetition(id: string): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    // 1. Check if poules or matches exist
    const { data: poules } = await supabase.from('poules').select('id').eq('competition_id', id)
    if (poules && poules.length > 0) {
      return { success: false, error: 'Deze competitie bevat nog poules. Verwijder deze eerst of sluit de competitie af.' }
    }

    const { error } = await supabase.from('competitions').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/admin/competitions')
    return { success: true }
  } catch (error: any) {
    console.error('deleteCompetition error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

// ─── POULES ──────────────────────────────────────────────────────────────────

export async function createPoule(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    const name = formData.get('name') as string
    const level = parseInt(formData.get('level') as string, 10)
    const competition_id = formData.get('competition_id') as string

    if (!name || isNaN(level) || !competition_id) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }

    const { error } = await supabase.from('poules').insert({ name, level, competition_id })

    if (error) throw error

    revalidatePath('/admin/poules')
    return { success: true }
  } catch (error: any) {
    console.error('createPoule error:', error)
    const msg = error?.message || JSON.stringify(error)
    return { success: false, error: msg || 'Onbekende fout' }
  }
}

// ─── PLAYERS ─────────────────────────────────────────────────────────────────

export async function createPlayer(formData: FormData): Promise<ActionResponse> {
  try {
    await ensureAdmin()

    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!first_name || !last_name || !email || !password) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    })

    const createUserData = await createUserRes.json()

    if (!createUserRes.ok) {
      const errMsg = createUserData?.message || createUserData?.msg || JSON.stringify(createUserData)
      throw new Error(errMsg)
    }

    const newUserId: string = createUserData.id
    if (!newUserId) throw new Error('Geen gebruiker ID ontvangen van Supabase.')

    const adminDbClient = getAdminClient()
    const { error: profileError } = await adminDbClient.from('profiles').upsert({
      id: newUserId,
      first_name,
      last_name,
      email,
      role: 'player',
      is_active: true,
      is_player: true,
      is_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    if (profileError) throw profileError

    revalidatePath('/admin/players')
    return { success: true }
  } catch (error: any) {
    console.error('createPlayer error:', error)
    const msg = error?.message || JSON.stringify(error)
    return { success: false, error: msg || 'Onbekende fout' }
  }
}

export async function updateMatchStatus(matchId: string, status: string): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()
    const { error } = await supabase.from('matches').update({ status }).eq('id', matchId)
    if (error) throw error

    revalidatePath('/admin/matches')
    return { success: true }
  } catch (error: any) {
    console.error('updateMatchStatus error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

// ─── TEAMS ───────────────────────────────────────────────────────────────────

export async function createTeam(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    const name = formData.get('name') as string
    const player1_id = formData.get('player1_id') as string
    const player2_id = formData.get('player2_id') as string

    if (!name || !player1_id || !player2_id) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }
    if (player1_id === player2_id) {
      return { success: false, error: 'Je kan niet tweemaal dezelfde speler selecteren.' }
    }

    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({ name })
      .select()
      .single()

    if (teamError) throw teamError

    const { error: memberError } = await supabase.from('team_members').insert([
      { team_id: teamData.id, player_id: player1_id },
      { team_id: teamData.id, player_id: player2_id },
    ])

    if (memberError) throw memberError

    revalidatePath('/admin/teams')
    return { success: true }
  } catch (error: any) {
    console.error('createTeam error:', error)
    const msg = error?.message || JSON.stringify(error)
    return { success: false, error: msg || 'Onbekende fout' }
  }
}

// ─── ADMINISTRATORS ───────────────────────────────────────────────────────────

export async function createAdmin(formData: FormData): Promise<ActionResponse & { tempPassword?: string }> {
  try {
    await ensureAdmin()
    const adminDb = getAdminClient()

    const name = formData.get('name') as string
    const email = formData.get('email') as string

    if (!name || !email) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }
    
    const [first_name, ...lastNameParts] = name.trim().split(' ')
    const last_name = lastNameParts.join(' ')
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ email, password: tempPassword, email_confirm: true }),
    })

    const createUserData = await createUserRes.json()

    if (!createUserRes.ok) {
      const errMsg = createUserData?.message || createUserData?.msg || JSON.stringify(createUserData)
      // Check if user already exists
      if (errMsg.toLowerCase().includes('already registered')) {
        // Just make them an admin
        const { error: updateError } = await adminDb
          .from('profiles')
          .update({ is_admin: true })
          .eq('email', email.toLowerCase().trim())
        if (updateError) throw updateError
        
        revalidatePath('/admin/administrators')
        return { success: true }
      }
      throw new Error(errMsg)
    }

    const newUserId: string = createUserData.id
    if (!newUserId) throw new Error('Geen gebruiker ID ontvangen van Supabase.')

    const { error: profileError } = await adminDb.from('profiles').upsert({
      id: newUserId,
      first_name,
      last_name,
      email,
      role: 'admin',
      is_active: true,
      is_admin: true,
      is_player: false, // NOT a player
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    if (profileError) throw profileError

    revalidatePath('/admin/administrators')
    return { success: true, tempPassword }
  } catch (error: any) {
    console.error('createAdmin error:', error)
    const msg = error?.message || JSON.stringify(error)
    return { success: false, error: msg || 'Onbekende fout' }
  }
}

export async function demoteFromAdmin(targetUserId: string): Promise<ActionResponse> {
  try {
    const { user } = await ensureAdmin()
    const adminDb = getAdminClient()

    if (targetUserId === user.id) {
      return { success: false, error: 'Je kan jezelf niet degraderen.' }
    }

    const { error } = await adminDb
      .from('profiles')
      .update({ is_admin: false, role: 'player' })
      .eq('id', targetUserId)

    if (error) throw error

    revalidatePath('/admin/administrators')
    revalidatePath('/admin/players')
    return { success: true }
  } catch (error: any) {
    console.error('demoteFromAdmin error:', error)
    const msg = error?.message || JSON.stringify(error)
    return { success: false, error: msg || 'Onbekende fout' }
  }
}
