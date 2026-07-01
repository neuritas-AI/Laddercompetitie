import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, CheckCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import AddAdminDialog from '@/components/admin/add-admin-dialog'
import DemoteAdminButton from './demote-button'

export default async function AdministratorsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: admins } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, is_active, avatar_url, created_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Administrators</h1>
          <p className="text-muted-foreground">Beheer de accounts die toegang hebben tot dit admin paneel.</p>
        </div>
        <AddAdminDialog />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" /> Admins ({admins?.length ?? 0})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {admins && admins.length > 0 ? (
            <div className="divide-y divide-border/40">
              {admins.map(admin => {
                const name = [admin.first_name, admin.last_name].filter(Boolean).join(' ') || admin.email
                const initials = name.slice(0, 2).toUpperCase()
                return (
                  <div key={admin.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center font-black text-gray-500">
                        {admin.avatar_url
                          ? <img src={admin.avatar_url} alt={name} className="w-full h-full object-cover" />
                          : initials
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{name}</p>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{admin.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-4 w-full sm:w-auto">
                      <div className="flex flex-col gap-1 min-w-[100px]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status</span>
                        {admin.is_active
                          ? <span className="flex items-center gap-1.5 text-xs font-bold text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Actief</span>
                          : <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">Inactief</span>
                        }
                      </div>
                      <div className="flex items-center gap-2 ml-auto sm:ml-0">
                        {user?.id !== admin.id && <DemoteAdminButton userId={admin.id} currentUserId={user?.id || ''} />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
