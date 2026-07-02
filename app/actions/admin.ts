'use server'

import { revalidatePath } from 'next/cache'
import { createClientWithUser } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export type ActionResponse = {
  success: boolean
  error?: string
}

export type AdminActionResponse = ActionResponse & {
  tempPassword?: string
  inviteSent?: boolean
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
  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) throw new Error('Not logged in')

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()

  const emailIsAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')
  const dbIsAdmin = data?.role === 'admin'

  if (!dbIsAdmin && !emailIsAdmin) {
    throw new Error('Unauthorized')
  }

  const adminSupabase = getAdminClient()

  // Auto-fix the role in the database if needed
  if (emailIsAdmin && !dbIsAdmin) {
    await adminSupabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
    const { data: adminRole } = await adminSupabase.from('roles').select('id').eq('name', 'admin').maybeSingle()
    if (adminRole?.id) {
      await adminSupabase.from('user_roles').upsert({ user_id: user.id, role_id: adminRole.id }, { onConflict: 'user_id,role_id' })
    }
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
    const price = parseFloat(formData.get('price') as string) || 0

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
      price,
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
    const price = parseFloat(formData.get('price') as string) || 0

    if (!name || !type || isNaN(season_year) || !start_date || !end_date) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }

    const { error } = await supabase
      .from('competitions')
      .update({ name, type, season_year, start_date, end_date, status, max_participants: isNaN(max_participants) ? null : max_participants, price })
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

export async function updatePoule(pouleId: string, formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    const name = formData.get('name') as string
    const level = parseInt(formData.get('level') as string, 10)
    const competition_id = formData.get('competition_id') as string

    if (!name || isNaN(level) || !competition_id) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }

    const { error } = await supabase
      .from('poules')
      .update({ name, level, competition_id, updated_at: new Date().toISOString() })
      .eq('id', pouleId)

    if (error) throw error

    revalidatePath('/admin/poules')
    return { success: true }
  } catch (error: any) {
    console.error('updatePoule error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

export async function deletePoule(pouleId: string, destinationPouleId?: string): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    const [{ data: playerEntries, error: playerError }, { data: teamEntries, error: teamError }] = await Promise.all([
      supabase.from('poule_players').select('player_id').eq('poule_id', pouleId),
      supabase.from('team_poules').select('team_id').eq('poule_id', pouleId),
    ])

    if (playerError) throw playerError
    if (teamError) throw teamError

    const playerCount = playerEntries?.length ?? 0
    const teamCount = teamEntries?.length ?? 0

    if ((playerCount || teamCount) > 0 && !destinationPouleId) {
      return {
        success: false,
        error: `Deze poule bevat nog ${playerCount} speler(s) en ${teamCount} team(s). Verplaats eerst de inhoud naar een andere poule of maak de huidige poule eerst leeg.`,
      }
    }

    if (destinationPouleId) {
      if (destinationPouleId === pouleId) {
        return { success: false, error: 'Kies een andere poule als bestemming.' }
      }

      if (playerCount > 0) {
        const playerRows = playerEntries.map((entry: any, index: number) => ({
          poule_id: destinationPouleId,
          player_id: entry.player_id,
          position: index + 1,
        }))

        const { error: upsertPlayersError } = await supabase
          .from('poule_players')
          .upsert(playerRows, { onConflict: 'poule_id,player_id' })
        if (upsertPlayersError) throw upsertPlayersError

        const { error: deletePlayersError } = await supabase
          .from('poule_players')
          .delete()
          .eq('poule_id', pouleId)
        if (deletePlayersError) throw deletePlayersError
      }

      if (teamCount > 0) {
        const teamRows = teamEntries.map((entry: any, index: number) => ({
          poule_id: destinationPouleId,
          team_id: entry.team_id,
          position: index + 1,
        }))

        const { error: upsertTeamsError } = await supabase
          .from('team_poules')
          .upsert(teamRows, { onConflict: 'poule_id,team_id' })
        if (upsertTeamsError) throw upsertTeamsError

        const { error: deleteTeamsError } = await supabase
          .from('team_poules')
          .delete()
          .eq('poule_id', pouleId)
        if (deleteTeamsError) throw deleteTeamsError
      }
    }

    const { error } = await supabase
      .from('poules')
      .update({ is_active: false, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', pouleId)

    if (error) throw error

    revalidatePath('/admin/poules')
    return { success: true }
  } catch (error: any) {
    console.error('deletePoule error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

async function generateMatchesForPoule(supabase: any, pouleId: string): Promise<ActionResponse> {
  try {
    const { data: players, error: playersError } = await supabase
      .from('poule_players')
      .select('player_id, position')
      .eq('poule_id', pouleId)
      .order('position', { ascending: true })

    if (playersError) throw playersError
    if (!players || players.length < 2) {
      return { success: true }
    }

    const { data: existingMatches, error: existingError } = await supabase
      .from('matches')
      .select('player1_id, player2_id')
      .eq('poule_id', pouleId)

    if (existingError) throw existingError

    const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)
    const existingPairSet = new Set((existingMatches ?? []).map((match: any) => pairKey(match.player1_id, match.player2_id)))

    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 30)
    const deadlineDate = deadline.toISOString().split('T')[0]

    const matchRows: any[] = []
    for (let i = 0; i < players.length - 1; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const key = pairKey(players[i].player_id, players[j].player_id)
        if (existingPairSet.has(key)) continue
        matchRows.push({
          poule_id: pouleId,
          player1_id: players[i].player_id,
          player2_id: players[j].player_id,
          deadline: deadlineDate,
          status: 'scheduled',
          score_player1: null,
          score_player2: null,
          winner_id: null,
        })
      }
    }

    if (matchRows.length === 0) {
      return { success: true }
    }

    const { error: insertError } = await supabase.from('matches').insert(matchRows)
    if (insertError) throw insertError

    return { success: true }
  } catch (error: any) {
    console.error('generateMatchesForPoule error:', error)
    return { success: false, error: error?.message || 'Kon geen wedstrijden genereren voor deze poule.' }
  }
}

async function recalculatePouleStandings(supabase: any, pouleId: string): Promise<ActionResponse> {
  try {
    const { data: players, error: playersError } = await supabase
      .from('poule_players')
      .select('id, player_id, created_at')
      .eq('poule_id', pouleId)

    if (playersError) throw playersError
    if (!players || players.length === 0) {
      return { success: true }
    }

    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('player1_id, player2_id, winner_id')
      .eq('poule_id', pouleId)
      .eq('status', 'confirmed')

    if (matchesError) throw matchesError

    const standings = new Map<string, { matches_played: number; matches_won: number; matches_lost: number }>()
    players.forEach((player: any) => {
      standings.set(player.player_id, { matches_played: 0, matches_won: 0, matches_lost: 0 })
    })

    for (const match of matches ?? []) {
      if (!match.player1_id || !match.player2_id || !match.winner_id) continue
      const player1 = standings.get(match.player1_id)
      const player2 = standings.get(match.player2_id)
      if (!player1 || !player2) continue

      player1.matches_played += 1
      player2.matches_played += 1

      if (match.winner_id === match.player1_id) {
        player1.matches_won += 1
        player2.matches_lost += 1
      } else {
        player2.matches_won += 1
        player1.matches_lost += 1
      }
    }

    const orderedPlayers = [...players].sort((a: any, b: any) => {
      const aStats = standings.get(a.player_id)!
      const bStats = standings.get(b.player_id)!
      if (bStats.matches_won !== aStats.matches_won) {
        return bStats.matches_won - aStats.matches_won
      }
      if (aStats.matches_lost !== bStats.matches_lost) {
        return aStats.matches_lost - bStats.matches_lost
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    for (let index = 0; index < orderedPlayers.length; index++) {
      const player = orderedPlayers[index]
      const stats = standings.get(player.player_id)!
      const { error: updateError } = await supabase
        .from('poule_players')
        .update({
          position: index + 1,
          matches_played: stats.matches_played,
          matches_won: stats.matches_won,
          matches_lost: stats.matches_lost,
        })
        .eq('id', player.id)
      if (updateError) throw updateError
    }

    return { success: true }
  } catch (error: any) {
    console.error('recalculatePouleStandings error:', error)
    return { success: false, error: error?.message || 'Kon de rangschikking niet bijwerken.' }
  }
}

export async function createPoule(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    const name = formData.get('name') as string
    const level = parseInt(formData.get('level') as string, 10)
    const competition_id = formData.get('competition_id') as string
    const playerIds = formData.getAll('player_ids').map((id) => String(id)).filter((id) => id)

    if (!name || isNaN(level) || !competition_id) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }

    const { data: createdPoule, error } = await supabase
      .from('poules')
      .insert({ name, level, competition_id, is_active: true })
      .select('id')
      .single()

    if (error || !createdPoule) throw error ?? new Error('Poule kon niet worden aangemaakt.')

    if (playerIds.length > 0) {
      const rows = playerIds.map((playerId, index) => ({
        poule_id: createdPoule.id,
        player_id: playerId,
        position: index + 1,
      }))

      const { error: playerError } = await supabase.from('poule_players').insert(rows)
      if (playerError) throw playerError

      const matchResult = await generateMatchesForPoule(supabase, createdPoule.id)
      if (!matchResult.success) throw new Error(matchResult.error || 'Kon geen wedstrijden aanmaken voor deze poule.')

      const standingsResult = await recalculatePouleStandings(supabase, createdPoule.id)
      if (!standingsResult.success) throw new Error(standingsResult.error || 'Kon de poulestand bijwerken.')
    }

    revalidatePath('/admin/poules')
    return { success: true }
  } catch (error: any) {
    console.error('createPoule error:', error)
    const msg = error?.message || JSON.stringify(error)
    return { success: false, error: msg || 'Onbekende fout' }
  }
}

export async function generatePouleGroups(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    const competitionId = formData.get('competition_id') as string
    const playersPerPoule = parseInt(formData.get('players_per_poule') as string, 10)
    const strategy = (formData.get('strategy') as string) || 'random'

    if (!competitionId || !playersPerPoule || playersPerPoule <= 0) {
      return { success: false, error: 'Kies een competitie en een poulegrootte.' }
    }

    const { data: registrations, error: registrationError } = await supabase
      .from('competition_registrations')
      .select('player_id')
      .eq('competition_id', competitionId)

    if (registrationError) throw registrationError

    const playerIds = (registrations ?? []).map((item: any) => item.player_id).filter(Boolean)
    if (playerIds.length === 0) {
      return { success: false, error: 'Er zijn nog geen spelers ingeschreven voor deze competitie.' }
    }

    const { data: players, error: playersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, created_at')
      .in('id', playerIds)
      .eq('is_active', true)
      .neq('role', 'admin')

    if (playersError) throw playersError

    const sortedPlayers = [...(players ?? [])].sort((a: any, b: any) => {
      if (strategy === 'ranking') {
        return (a.created_at || '').localeCompare(b.created_at || '')
      }
      if (strategy === 'last_season') {
        return (a.created_at || '').localeCompare(b.created_at || '')
      }
      if (strategy === 'manual') {
        return (a.created_at || '').localeCompare(b.created_at || '')
      }
      return Math.random() - 0.5
    })

    const groups: any[][] = []
    for (let index = 0; index < sortedPlayers.length; index += playersPerPoule) {
      groups.push(sortedPlayers.slice(index, index + playersPerPoule))
    }

    if (groups.length === 0) {
      return { success: false, error: 'Er konden geen poules worden aangemaakt.' }
    }

    for (const [groupIndex, group] of groups.entries()) {
      const { data: createdPoule, error: pouleError } = await supabase
        .from('poules')
        .insert({
          name: `Poule ${groupIndex + 1}`,
          competition_id: competitionId,
          level: groupIndex + 1,
          is_active: true,
        })
        .select('id')
        .single()

      if (pouleError || !createdPoule) continue

      const rows = group.map((player: any, positionIndex: number) => ({
        poule_id: createdPoule.id,
        player_id: player.id,
        position: positionIndex + 1,
      }))

      const { error: playerInsertError } = await supabase.from('poule_players').insert(rows)
      if (playerInsertError) throw playerInsertError

      const matchResult = await generateMatchesForPoule(supabase, createdPoule.id)
      if (!matchResult.success) throw new Error(matchResult.error || 'Kon geen wedstrijden aanmaken voor de gegenereerde poule.')

      const standingsResult = await recalculatePouleStandings(supabase, createdPoule.id)
      if (!standingsResult.success) throw new Error(standingsResult.error || 'Kon de poulestand bijwerken.')
    }

    revalidatePath('/admin/poules')
    return { success: true }
  } catch (error: any) {
    console.error('generatePouleGroups error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

export async function movePlayerToPoule(playerId: string, fromPouleId: string, toPouleId: string): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    if (!playerId || !fromPouleId || !toPouleId || fromPouleId === toPouleId) {
      return { success: false, error: 'Selectie is ongeldig.' }
    }

    const { data: existingEntries, error: lookupError } = await supabase
      .from('poule_players')
      .select('position')
      .eq('poule_id', toPouleId)
      .order('position', { ascending: true })

    if (lookupError) throw lookupError

    const nextPosition = (existingEntries?.length ?? 0) + 1

    const { error: deleteError } = await supabase
      .from('poule_players')
      .delete()
      .eq('player_id', playerId)
      .eq('poule_id', fromPouleId)

    if (deleteError) throw deleteError

    const { error: insertError } = await supabase.from('poule_players').insert({
      poule_id: toPouleId,
      player_id: playerId,
      position: nextPosition,
    })

    if (insertError) throw insertError

    await supabase.from('matches').delete().eq('poule_id', fromPouleId).or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)

    const generateResult = await generateMatchesForPoule(supabase, toPouleId)
    if (!generateResult.success) throw new Error(generateResult.error || 'Kon geen wedstrijden genereren in de doelpoule.')

    const recalcFrom = await recalculatePouleStandings(supabase, fromPouleId)
    if (!recalcFrom.success) throw new Error(recalcFrom.error || 'Kon de oorspronkelijke poule niet bijwerken.')

    const recalcTo = await recalculatePouleStandings(supabase, toPouleId)
    if (!recalcTo.success) throw new Error(recalcTo.error || 'Kon de doelpoule niet bijwerken.')

    revalidatePath('/admin/poules')
    return { success: true }
  } catch (error: any) {
    console.error('movePlayerToPoule error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

export async function addPlayerToPoule(pouleId: string, playerId: string): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    if (!pouleId || !playerId) {
      return { success: false, error: 'Selectie is ongeldig.' }
    }

    const { data: existingEntries, error: lookupError } = await supabase
      .from('poule_players')
      .select('position')
      .eq('poule_id', pouleId)
      .order('position', { ascending: true })

    if (lookupError) throw lookupError

    const nextPosition = (existingEntries?.length ?? 0) + 1

    const { error: insertError } = await supabase.from('poule_players').insert({
      poule_id: pouleId,
      player_id: playerId,
      position: nextPosition,
    })

    if (insertError) throw insertError

    const matchesResult = await generateMatchesForPoule(supabase, pouleId)
    if (!matchesResult.success) throw new Error(matchesResult.error || 'Kon geen wedstrijden genereren voor deze poule.')

    const standingsResult = await recalculatePouleStandings(supabase, pouleId)
    if (!standingsResult.success) throw new Error(standingsResult.error || 'Kon de poulestand niet bijwerken.')

    revalidatePath('/admin/poules')
    return { success: true }
  } catch (error: any) {
    console.error('addPlayerToPoule error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

export async function removePlayerFromPoule(playerId: string, pouleId: string): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()

    if (!playerId || !pouleId) {
      return { success: false, error: 'Selectie is ongeldig.' }
    }

    const { error: deleteEntriesError } = await supabase
      .from('poule_players')
      .delete()
      .eq('player_id', playerId)
      .eq('poule_id', pouleId)

    if (deleteEntriesError) throw deleteEntriesError

    const { error: deleteMatchesError } = await supabase
      .from('matches')
      .delete()
      .eq('poule_id', pouleId)
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)

    if (deleteMatchesError) throw deleteMatchesError

    const standingsResult = await recalculatePouleStandings(supabase, pouleId)
    if (!standingsResult.success) throw new Error(standingsResult.error || 'Kon de poulestand niet bijwerken.')

    revalidatePath('/admin/poules')
    return { success: true }
  } catch (error: any) {
    console.error('removePlayerFromPoule error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
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
      account_status: 'active',
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

export async function deactivatePlayer(playerId: string): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false, account_status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', playerId)

    if (error) throw error

    revalidatePath('/admin/players')
    return { success: true }
  } catch (error: any) {
    console.error('deactivatePlayer error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

export async function activatePlayer(playerId: string): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: true, account_status: 'active', blocked_reason: null, updated_at: new Date().toISOString() })
      .eq('id', playerId)

    if (error) throw error

    revalidatePath('/admin/players')
    return { success: true }
  } catch (error: any) {
    console.error('activatePlayer error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

export async function blockPlayer(playerId: string, reason?: string): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()
    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        account_status: 'blocked',
        blocked_reason: reason || 'Geblokkeerd door beheerder',
        updated_at: new Date().toISOString(),
      })
      .eq('id', playerId)

    if (error) throw error

    revalidatePath('/admin/players')
    return { success: true }
  } catch (error: any) {
    console.error('blockPlayer error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
  }
}

export async function deletePlayer(playerId: string): Promise<ActionResponse> {
  try {
    const { supabase } = await ensureAdmin()
    const adminDb = getAdminClient()

    // Remove references that are not cascade-safe before deleting the auth user.
    const cleanupSteps = [
      supabase.from('match_scores').delete().or(`submitted_by.eq.${playerId},confirmed_by.eq.${playerId},winner_id.eq.${playerId}`),
      supabase.from('matches').delete().or(`player1_id.eq.${playerId},player2_id.eq.${playerId},winner_id.eq.${playerId}`),
    ]

    for (const step of cleanupSteps) {
      const { error } = await step
      if (error) throw error
    }

    const { error: deleteUserError } = await adminDb.auth.admin.deleteUser(playerId)
    if (deleteUserError) throw deleteUserError

    revalidatePath('/admin/players')
    return { success: true }
  } catch (error: any) {
    console.error('deletePlayer error:', error)
    return { success: false, error: error?.message || 'Onbekende fout' }
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

export async function createAdmin(formData: FormData): Promise<AdminActionResponse> {
  try {
    await ensureAdmin()
    const adminDb = getAdminClient()

    const name = formData.get('name') as string
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const password = formData.get('password') as string

    if (!name || !email || !password) {
      return { success: false, error: 'Alle velden zijn verplicht.' }
    }

    if (password.length < 8) {
      return { success: false, error: 'Wachtwoord moet minstens 8 tekens bevatten.' }
    }

    const [first_name, ...lastNameParts] = name.trim().split(' ')
    const last_name = lastNameParts.join(' ')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
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

    const createUserData = await createUserRes.json().catch(() => ({}))

    const formatSupabaseError = (error: any) => {
      if (!error) return 'Gebruiker kon niet worden aangemaakt.'
      if (typeof error === 'string') return error
      const details = [
        error.message,
        error.msg,
        error.details,
        error.hint,
        error.code,
        error.status,
      ].filter(Boolean)
      if (details.length) return details.join(' | ')
      const json = JSON.stringify(error, Object.getOwnPropertyNames(error))
      if (!json || json === '{}' || json === '[]') return 'Gebruiker kon niet worden aangemaakt.'
      return json
    }

    const duplicateErrorMessage = (message?: string) => {
      return !!message && /already|duplicate|registered|exists/i.test(message)
    }

    if (!createUserRes.ok) {
      const errMsg = createUserData?.message || createUserData?.msg || formatSupabaseError(createUserData) || 'Gebruiker kon niet worden aangemaakt.'
      if (duplicateErrorMessage(errMsg)) {
        const existingUser = await adminDb.from('auth.users').select('id').eq('email', email).maybeSingle()
        const userId = existingUser.data?.id
        if (!userId) {
          throw new Error('Deze gebruiker bestaat al, maar is niet in de database terug te vinden.')
        }

        const { data: adminRole } = await adminDb.from('roles').select('id').eq('name', 'admin').maybeSingle()
        if (adminRole?.id) {
          await adminDb.from('user_roles').upsert({ user_id: userId, role_id: adminRole.id }, { onConflict: 'user_id,role_id' })
        }

        const { error: updateError } = await adminDb
          .from('profiles')
          .upsert({
            id: userId,
            email,
            role: 'admin',
            is_active: true,
            account_status: 'active',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
        if (updateError) throw updateError

        revalidatePath('/admin/administrators')
        return { success: true }
      }

      return { success: false, error: errMsg }
    }

    const newUserId: string = createUserData?.id
    if (!newUserId) {
      return { success: false, error: 'Geen gebruiker ID ontvangen van Supabase.' }
    }

    const { data: adminRole } = await adminDb.from('roles').select('id').eq('name', 'admin').maybeSingle()
    if (adminRole?.id) {
      await adminDb.from('user_roles').upsert({ user_id: newUserId, role_id: adminRole.id }, { onConflict: 'user_id,role_id' })
    }

    const { error: profileError } = await adminDb.from('profiles').upsert({
      id: newUserId,
      first_name,
      last_name,
      email,
      role: 'admin',
      is_active: true,
      account_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    if (profileError) throw profileError

    revalidatePath('/admin/administrators')
    return { success: true }
  } catch (error: any) {
    console.error('createAdmin error:', error)
    const msg = typeof error === 'string'
      ? error
      : error?.message || error?.toString?.() || JSON.stringify(error)
    const normalized = msg === '{}' || msg === '[]' ? 'Onbekende fout' : msg
    return { success: false, error: normalized || 'Onbekende fout' }
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
      .update({ role: 'player' })
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
