'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type ProfileUpdateResult = {
  success: boolean
  error?: string
}

async function readUserProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  return supabase.from('profiles').select('preferences').eq('id', userId).maybeSingle()
}

async function toDataUrl(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  return `data:${file.type || 'image/png'};base64,${base64}`
}

export async function updateProfile(formData: FormData): Promise<ProfileUpdateResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Niet ingelogd.' }
  }

  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const phone = formData.get('phone') as string
  const share_phone = formData.get('share_phone') === 'on'

  const updates: Record<string, any> = {
    first_name: first_name || null,
    last_name: last_name || null,
    phone: phone || null,
    share_phone,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateNotificationPreferences(formData: FormData): Promise<ProfileUpdateResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Niet ingelogd.' }
  }

  const notifications = formData.getAll('notifications') as string[]

  const { data: profile } = await readUserProfile(supabase, user.id)
  const prefs = profile?.preferences || {}
  prefs.notifications = notifications

  const { error } = await supabase
    .from('profiles')
    .update({ preferences: prefs })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function uploadAvatar(formData: FormData): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Niet ingelogd.' }
  }

  const file = formData.get('avatar') as File
  if (!file || file.size === 0) {
    return { success: false, error: 'Geen bestand geselecteerd.' }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'Bestand is te groot (max 2MB).' }
  }

  const avatarUrl = await toDataUrl(file)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/matches')
  revalidatePath('/ranking')
  revalidatePath('/', 'layout')

  return { success: true, avatarUrl }
}

export async function removeAvatar(): Promise<ProfileUpdateResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Niet ingelogd.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/matches')
  revalidatePath('/ranking')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updatePassword(formData: FormData): Promise<ProfileUpdateResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Niet ingelogd.' }
  }

  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Wachtwoord moet minstens 8 tekens bevatten.' }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Wachtwoorden komen niet overeen.' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
