import { createClientWithUser } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Logo from '@/components/logo'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { supabase, user, authError } = await createClientWithUser()
  // If auth threw due to invalid refresh token, treat as not authenticated
  if (user) redirect('/dashboard')

  const params = await searchParams
  const errorMsg = params.error
  const successMsg = params.success

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center space-y-3 pb-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <CardTitle className="text-3xl font-extrabold">Welkom terug</CardTitle>
        <CardDescription className="text-base">Meld je aan bij je TPA Ladder account</CardDescription>
      </CardHeader>
      <CardContent>
        {successMsg && (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700 mb-5">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{decodeURIComponent(successMsg)}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{decodeURIComponent(errorMsg)}</span>
          </div>
        )}

        <form action="/api/auth/login" method="POST" className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="E-mailadres"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold">
            Aanmelden
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nog geen account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Registreer hier
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
