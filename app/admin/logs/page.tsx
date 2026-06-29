import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSearch } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function AdminLogsPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('admin_logs')
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      created_at,
      admin:profiles(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logboek</h1>
        <p className="text-muted-foreground">Overzicht van alle beheeracties in het systeem.</p>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            Recente Acties ({logs?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs && logs.length > 0 ? (
            <div className="divide-y divide-border/40">
              {logs.map((log) => {
                const admin = log.admin as any
                const adminName = admin
                  ? `${admin.first_name ?? ''} ${admin.last_name ?? ''}`.trim() || admin.email
                  : 'Systeem'
                return (
                  <div key={log.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors gap-3">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0 mt-0.5">
                        {adminName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{log.action}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          {log.entity_type && <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 uppercase">{log.entity_type}</span>}
                          Door: {adminName}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap shrink-0">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FileSearch className="w-14 h-14 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground text-lg">Nog geen logboekitems</p>
              <p className="text-sm text-muted-foreground/70 mt-1 font-medium">Beheeracties worden hier automatisch bijgehouden.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
