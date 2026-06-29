// Redirect /admin/users → /admin/players (users page is now players)
import { redirect } from 'next/navigation'

export default function AdminUsersPage() {
  redirect('/admin/players')
}
