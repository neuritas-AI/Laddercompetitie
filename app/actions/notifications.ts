'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: 'match_tomorrow' | 'match_today' | 'score_entered' | 'match_scheduled' | 'score_confirmed',
  linkUrl?: string
) {
  const supabase = await createClient()

  // First check if the user has opted in for this notification
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single()

  const notificationsOptIn = profile?.preferences?.notifications || []
  
  // If notifications array exists and doesn't include the type, abort (user opted out)
  // If array is empty, default is to send (opted in by default)
  if (profile?.preferences?.notifications && !notificationsOptIn.includes(type)) {
    return { success: false, reason: 'user_opted_out' }
  }

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      link_url: linkUrl,
      is_read: false
    })

  if (error) {
    console.error('Failed to insert notification:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}
