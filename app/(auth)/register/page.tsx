import { createClientWithUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import Logo from '@/components/logo'
import RegisterClient from './register-client'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { supabase, user, authError } = await createClientWithUser()
  if (user) redirect('/dashboard')

  const params = await searchParams
  const errorMsg = params.error
  const isSuccess = params.success === '1'

  // Fetch open competitions from database
  // No competition selection during registration. Competitie-inschrijving gebeurt later via de Competities-pagina.

  return (
    <Card className="w-full max-w-2xl shadow-xl border-0">
      <CardHeader className="text-center space-y-3 pb-6">
        <div className="flex justify-center">
          <Logo size="md" />
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
          <RegisterClient errorMsg={errorMsg} />
        )}
      </CardContent>
    </Card>
  )
}
