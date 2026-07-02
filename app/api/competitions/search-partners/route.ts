import { NextResponse } from 'next/server'
import { createClientWithUser } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const competitionId = url.searchParams.get('competitionId')
  const query = (url.searchParams.get('q') ?? '').trim()
  const page = Math.max(Number(url.searchParams.get('page') ?? '1'), 1)
  const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? '10'), 1), 50)

  if (!competitionId) {
    return NextResponse.json({ error: 'Ontbrekende competitie.' }, { status: 400 })
  }

  const { supabase, user, authError } = await createClientWithUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const adminDb = createSupabaseClient(supabaseUrl, serviceRoleKey)

  const { data: registeredTeams, error: registeredTeamsError } = await adminDb
    .from('competition_team_registrations')
    .select('team_id')
    .eq('competition_id', competitionId)

  if (registeredTeamsError) {
    return NextResponse.json({ error: registeredTeamsError.message }, { status: 500 })
  }

  const teamIds = (registeredTeams ?? []).map(item => item.team_id)
  const excludedIds = new Set<string>([user.id])

  if (teamIds.length > 0) {
    const { data: occupiedMembers, error: occupiedError } = await adminDb
      .from('team_members')
      .select('player_id')
      .in('team_id', teamIds)

    if (occupiedError) {
      return NextResponse.json({ error: occupiedError.message }, { status: 500 })
    }

    occupiedMembers?.forEach(member => {
      if (member.player_id) excludedIds.add(member.player_id)
    })
  }

  let searchQuery = supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'player')
    .eq('is_active', true)
    .neq('id', user.id)

  const excludedArray = Array.from(excludedIds)
  if (excludedArray.length > 0) {
    const exclusionList = `(${excludedArray.join(',')})`
    searchQuery = searchQuery.filter('id', 'not.in', exclusionList)
  }

  if (query) {
    const escapedQuery = query.replace(/[%_]/g, ch => `\\${ch}`)
    const likeQuery = `%${escapedQuery}%`
    searchQuery = searchQuery.or(`first_name.ilike.${likeQuery},last_name.ilike.${likeQuery}`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await searchQuery
    .order('first_name', { ascending: true })
    .order('last_name', { ascending: true })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], page, pageSize, hasMore: (data?.length ?? 0) === pageSize })
}
