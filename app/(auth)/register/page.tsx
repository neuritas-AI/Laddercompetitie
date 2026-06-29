import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Trophy } from 'lucide-react'

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-2xl shadow-xl border-0">
      <CardHeader className="text-center space-y-3 pb-6">
        <div className="flex justify-center">
          <div className="bg-primary/10 rounded-full p-3">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-3xl font-extrabold">Account aanmaken</CardTitle>
        <CardDescription className="text-base">Schrijf je in voor de Tennis Ladder competitie</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" action="/api/auth/sign-up" method="post">
          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">Voornaam</Label>
              <Input id="first_name" name="first_name" required className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Achternaam</Label>
              <Input id="last_name" name="last_name" required className="h-10" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input id="email" name="email" type="email" required className="h-10" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input id="password" name="password" type="password" required className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon</Label>
              <Input id="phone" name="phone" type="tel" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Geboortedatum</Label>
              <Input id="birth_date" name="birth_date" type="date" className="h-10" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Input id="address" name="address" className="h-10" />
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="text-base font-semibold mb-4">Selecteer competities</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'comp_single_winter', value: 'single_winter', label: 'Enkel Winter' },
                { id: 'comp_single_summer', value: 'single_summer', label: 'Enkel Zomer' },
                { id: 'comp_double_winter', value: 'double_winter', label: 'Dubbel Winter' },
                { id: 'comp_double_summer', value: 'double_summer', label: 'Dubbel Zomer' },
              ].map(({ id, value, label }) => (
                <label key={id} htmlFor={id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-border hover:border-primary transition-colors">
                  <Checkbox id={id} name="competitions" value={value} />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold">
            Registreren
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Heb je al een account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Meld je aan
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
