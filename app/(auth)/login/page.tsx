import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'

export default async function LoginPage() {
  // Redirect if already logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center space-y-3 pb-6">
        <div className="flex justify-center">
          <div className="bg-primary/10 rounded-full p-3">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-3xl font-extrabold">Welkom terug</CardTitle>
        <CardDescription className="text-base">Meld je aan bij je Tennis Ladder account</CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/api/auth/login" method="POST" className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="naam@voorbeeld.be"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary"
              />
              <label htmlFor="remember-me" className="text-sm text-muted-foreground">Onthoud mij</label>
            </div>
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Wachtwoord vergeten?
            </Link>
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
