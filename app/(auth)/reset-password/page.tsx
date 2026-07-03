import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Logo from '@/components/logo'
import ResetPasswordClient from './reset-password-client'

export default function ResetPasswordPage() {
  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center space-y-3 pb-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <CardTitle className="text-3xl font-extrabold">Nieuw wachtwoord</CardTitle>
        <CardDescription className="text-base">Kies een nieuw wachtwoord voor je account.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordClient />
      </CardContent>
    </Card>
  )
}
