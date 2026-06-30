'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type ProfileUpdateResult = {
  success: boolean
  error?: string
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
  const address = formData.get('address') as string
  const birth_date = formData.get('birth_date') as string
  const share_phone = formData.get('share_phone') === 'on'

  const updates: Record<string, any> = {
    first_name,
    last_name,
    phone: phone || null,
    address: address || null,
    birth_date: birth_date || null,
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
  
  // Get existing preferences first
  const { data: profile } = await supabase.from('profiles').select('preferences').eq('id', user.id).single()
  const prefs = profile?.preferences || {}
  prefs.notifications = notifications

  const { error } = await supabase
    .from('profiles')
    .update({ preferences: prefs })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

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

  const ext = file.name.split('.').pop()
  const filePath = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath('/', 'layout')

  return { success: true, avatarUrl }
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
