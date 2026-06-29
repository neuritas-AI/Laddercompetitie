import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-background">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-card">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-foreground">Welkom terug</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-muted-foreground">
            Meld je aan bij je Tennis Ladder account
          </p>
        </div>
        <form className="mt-8 space-y-6" action="/auth/sign-in" method="post">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full"
                placeholder="naam@voorbeeld.be"
              />
            </div>
            <div>
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-muted-foreground">
                Onthoud mij
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary/80">
                Wachtwoord vergeten?
              </a>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full h-12 text-lg">
              Aanmelden
            </Button>
          </div>
        </form>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-muted-foreground">
            Nog geen account?{' '}
            <Link href="/register" className="font-medium text-primary hover:text-primary/80">
              Registreer hier
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
