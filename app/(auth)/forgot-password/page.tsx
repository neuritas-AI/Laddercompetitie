import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Logo from '@/components/logo'
import ForgotPasswordClient from './forgot-password-client'

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center space-y-3 pb-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <CardTitle className="text-3xl font-extrabold">Wachtwoord vergeten</CardTitle>
        <CardDescription className="text-base">
          Vul je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordClient />
      </CardContent>
    </Card>
  )
}
