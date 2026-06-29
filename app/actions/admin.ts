'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export type ActionResponse = {
  success: boolean
  error?: string
}

// Ensure the user is an admin
async function ensureAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not logged in')

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  return { supabase, user }
}

export async function createCompetition(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()
    
    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const season_year = parseInt(formData.get('season_year') as string, 10)
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string

    if (!name || !type || !season_year || !start_date || !end_date) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }

    const { error } = await supabase.from('competitions').insert({
      name,
      type,
      season_year,
      start_date,
      end_date,
      is_active: true,
    })

    if (error) throw error

    revalidatePath('/admin/competitions')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createPoule(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()
    
    const name = formData.get('name') as string
    const level = parseInt(formData.get('level') as string, 10)
    const competition_id = formData.get('competition_id') as string

    if (!name || isNaN(level) || !competition_id) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }

    const { error } = await supabase.from('poules').insert({
      name,
      level,
      competition_id,
    })

    if (error) throw error

    revalidatePath('/admin/poules')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

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

    // Use the Service Role Key to create the user without logging the admin out
    const adminAuthClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    )

    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    if (authData.user) {
      // Create profile record
      const { error: profileError } = await adminAuthClient.from('profiles').upsert({
        id: authData.user.id,
        first_name,
        last_name,
        email,
        role: 'player',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (profileError) throw profileError
    }

    revalidatePath('/admin/players')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

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

    // Create the team
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({ name })
      .select()
      .single()

    if (teamError) throw teamError

    // Add players to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert([
        { team_id: teamData.id, player_id: player1_id },
        { team_id: teamData.id, player_id: player2_id }
      ])

    if (memberError) throw memberError

    revalidatePath('/admin/teams')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
