export async function hasUserRole(supabase: any, userId: string, roleName: string) {
  if (!userId) return false

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (!profileError && profile?.role === roleName) {
    return true
  }

  const { data: roleRows, error: roleError } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId)

  if (roleError) {
    return false
  }

  return (roleRows || []).some((row: any) => (row.roles as any)?.name === roleName)
}

export async function ensureUserRole(supabase: any, userId: string, roleName: string) {
  if (!userId) return { success: false, error: 'Missing user id' }

  const { data: roleData, error: roleLookupError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .maybeSingle()

  if (roleLookupError || !roleData?.id) {
    return { success: false, error: roleLookupError?.message || 'Role not found' }
  }

  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role_id: roleData.id }, { onConflict: 'user_id,role_id' })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
