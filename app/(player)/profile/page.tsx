import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Lock, Bell } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">Mijn Profiel</h1>
        <p className="text-muted-foreground">Beheer je persoonlijke gegevens en voorkeuren.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar Card */}
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src="" alt="Profiel foto" />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">JP</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">Jan Peeters</p>
            <p className="text-sm text-muted-foreground">jan@example.com</p>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Foto wijzigen
          </Button>
        </Card>

        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Persoonlijke gegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/api/profile/update" method="post" className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Voornaam</Label>
                  <Input id="first_name" name="first_name" defaultValue="Jan" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Achternaam</Label>
                  <Input id="last_name" name="last_name" defaultValue="Peeters" className="h-10" />
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
              <div className="flex justify-end pt-2">
                <Button type="submit">Opslaan</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Wachtwoord wijzigen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/api/profile/password" method="post" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Huidig wachtwoord</Label>
                <Input id="current_password" name="current_password" type="password" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Nieuw wachtwoord</Label>
                <Input id="new_password" name="new_password" type="password" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Bevestig wachtwoord</Label>
                <Input id="confirm_password" name="confirm_password" type="password" className="h-10" />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <Button type="submit" variant="outline">Wachtwoord wijzigen</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Notification prefs */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Meldingen
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              'Nieuwe wedstrijd gepland',
              'Score ingegeven door tegenstander',
              'Herinnering 2 dagen voor wedstrijd',
              'Herinnering dag van wedstrijd',
              'Promotie of degradatie',
              'Competitie gestart',
            ].map((item) => (
              <label key={item} className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary" />
                <span className="text-sm font-medium">{item}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
