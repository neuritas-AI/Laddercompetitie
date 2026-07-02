import { createClientWithUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { supabase, user, authError } = await createClientWithUser()

  if (authError || !user) {
    return redirect('/login')
  }

  if (user) {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  } else {
    redirect('/login')
  }
}
