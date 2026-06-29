import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-card">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-foreground">Maak een account aan</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-muted-foreground">
            Schrijf je in voor de Tennis Ladder
          </p>
        </div>
        <form className="mt-8 space-y-6" action="/auth/sign-up" method="post">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">Voornaam</Label>
              <Input id="first_name" name="first_name" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="last_name">Achternaam</Label>
              <Input id="last_name" name="last_name" required className="mt-1" />
            </div>
            
            <div className="sm:col-span-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input id="email" name="email" type="email" required className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input id="password" name="password" type="password" required className="mt-1" />
            </div>

            <div>
              <Label htmlFor="phone">Telefoon</Label>
              <Input id="phone" name="phone" type="tel" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="birth_date">Geboortedatum</Label>
              <Input id="birth_date" name="birth_date" type="date" className="mt-1" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="address">Adres</Label>
              <Input id="address" name="address" className="mt-1" />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-4">Selecteer competities</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <Checkbox id="comp_single_winter" name="competitions" value="single_winter" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="comp_single_winter" className="font-medium text-gray-700 dark:text-foreground">Enkel Winter</label>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <Checkbox id="comp_single_summer" name="competitions" value="single_summer" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="comp_single_summer" className="font-medium text-gray-700 dark:text-foreground">Enkel Zomer</label>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <Checkbox id="comp_double_winter" name="competitions" value="double_winter" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="comp_double_winter" className="font-medium text-gray-700 dark:text-foreground">Dubbel Winter</label>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <Checkbox id="comp_double_summer" name="competitions" value="double_summer" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="comp_double_summer" className="font-medium text-gray-700 dark:text-foreground">Dubbel Zomer</label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full h-12 text-lg">
              Registreren & Betalen
            </Button>
            <p className="mt-2 text-xs text-center text-gray-500">
              * Je wordt doorgestuurd naar de betaalpagina. (Momenteel overgeslagen in lokale test).
            </p>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-muted-foreground">
            Heb je al een account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Meld je aan
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
