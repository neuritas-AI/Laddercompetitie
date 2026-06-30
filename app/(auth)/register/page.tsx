import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Trophy, CheckCircle } from 'lucide-react'
import RegisterClient from './register-client'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const params = await searchParams
  const errorMsg = params.error
  const isSuccess = params.success === '1'

  // Fetch open competitions from database
  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, name, type, season_year, status, max_participants')
    .eq('status', 'open')
    .order('season_year', { ascending: false })

  const typeLabels: Record<string, string> = {
    single_winter: 'Enkel Winter',
    single_summer: 'Enkel Zomer',
    double_winter: 'Dubbel Winter',
    double_summer: 'Dubbel Zomer',
  }

  return (
    <Card className="w-full max-w-2xl shadow-xl border-0">
      <CardHeader className="text-center space-y-3 pb-6">
        <div className="flex justify-center">
          <div className="bg-primary/10 rounded-full p-3">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-3xl font-extrabold">Account aanmaken</CardTitle>
        <CardDescription className="text-base">Schrijf je in voor de TPA Ladder competitie</CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="text-center py-10 space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">Account aangemaakt!</h2>
            <p className="text-muted-foreground">
              Je account werd succesvol aangemaakt. Je kan nu aanmelden.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Aanmelden
            </Link>
          </div>
        ) : (
          <RegisterClient
            competitions={(competitions ?? []).map(c => ({
              id: c.id,
              name: c.name,
              label: `${typeLabels[c.type] ?? c.type} ${c.season_year}`,
            }))}
            errorMsg={errorMsg}
          />
        )}
      </CardContent>
    </Card>
  )
}
