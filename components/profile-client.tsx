'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Lock, Bell, Loader2, CheckCircle2, AlertCircle, Mail, Phone } from 'lucide-react'
import { updateProfile, updatePassword, uploadAvatar, updateNotificationPreferences } from '@/app/actions/profile'
import { getDisplayName, getInitials } from '@/lib/profile'

interface Profile {
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  address: string | null
  birth_date: string | null
  avatar_url: string | null
  share_phone?: boolean | null
  preferences?: { notifications?: string[] } | null
}

interface Props {
  profile: Profile
}

export default function ProfileClient({ profile: initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile)
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isPwPending, startPwTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    setProfile(initialProfile)
    setAvatarUrl(initialProfile.avatar_url ?? '')
  }, [initialProfile])

  const displayName = getDisplayName(profile)
  const initials = getInitials(profile)

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return
    setUploading(true)
    setUploadMsg(null)
    try {
      const fd = new FormData()
      fd.append('avatar', event.target.files[0])
      const result = await uploadAvatar(fd)
      if (result.success && result.avatarUrl) {
        setAvatarUrl(result.avatarUrl)
        setUploadMsg({ type: 'success', text: 'Profielfoto opgeslagen!' })
        router.refresh()
      } else {
        setUploadMsg({ type: 'error', text: result.error ?? 'Upload mislukt.' })
      }
    } catch {
      setUploadMsg({ type: 'error', text: 'Er is een fout opgetreden.' })
    } finally {
      setUploading(false)
    }
  }

  const handleProfileSave = async (formData: FormData) => {
    setSaveMsg(null)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.success) {
        const updated = {
          ...profile,
          first_name: (formData.get('first_name') as string) || null,
          last_name: (formData.get('last_name') as string) || null,
          phone: (formData.get('phone') as string) || null,
          address: (formData.get('address') as string) || null,
          birth_date: (formData.get('birth_date') as string) || null,
          share_phone: formData.get('share_phone') === 'on',
        }
        setProfile(updated)
        setSaveMsg({ type: 'success', text: 'Profiel opgeslagen!' })
        router.refresh()
      } else {
        setSaveMsg({ type: 'error', text: result.error ?? 'Opslaan mislukt.' })
      }
    })
  }

  const handlePasswordSave = async (formData: FormData) => {
    setPwMsg(null)
    startPwTransition(async () => {
      const result = await updatePassword(formData)
      if (result.success) {
        setPwMsg({ type: 'success', text: 'Wachtwoord gewijzigd!' })
      } else {
        setPwMsg({ type: 'error', text: result.error ?? 'Wijzigen mislukt.' })
      }
    })
  }

  const handleNotificationSave = async (formData: FormData) => {
    setSaveMsg(null)
    startTransition(async () => {
      const result = await updateNotificationPreferences(formData)
      if (result.success) {
        setSaveMsg({ type: 'success', text: 'Meldingen opgeslagen!' })
        router.refresh()
      } else {
        setSaveMsg({ type: 'error', text: result.error ?? 'Opslaan mislukt.' })
      }
    })
  }

  const allowedNotifications = [
    { value: 'match_tomorrow', label: 'Herinnering 1 dag voor wedstrijd' },
    { value: 'match_today', label: 'Herinnering dag van wedstrijd' },
    { value: 'score_entered', label: 'Tegenstander heeft score ingegeven' },
    { value: 'match_scheduled', label: 'Nieuwe wedstrijd gepland' }
  ]

  const userNotifications = profile.preferences?.notifications || []

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden border-0 shadow-soft">
        <div className="bg-mockup-red px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{displayName}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                <p className="text-white/80 text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
                {profile.phone && (
                  <p className="text-white/80 text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5">
                    <Phone className="w-4 h-4" />
                    {profile.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="relative">
              <Button variant="outline" size="sm" className="flex items-center gap-2 font-bold cursor-pointer relative bg-white/10 border-white/30 text-white hover:bg-white/20" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploading ? 'Uploaden...' : 'Foto wijzigen'}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </Button>
            </div>
          </div>
          {uploadMsg && (
            <p className={`text-sm font-semibold flex items-center gap-1.5 mt-4 justify-center sm:justify-start ${uploadMsg.type === 'success' ? 'text-green-200' : 'text-red-200'}`}>
              {uploadMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {uploadMsg.text}
            </p>
          )}
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Persoonlijke gegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleProfileSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Voornaam</Label>
                  <Input id="first_name" name="first_name" defaultValue={profile.first_name ?? ''} key={`fn-${profile.first_name}`} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Achternaam</Label>
                  <Input id="last_name" name="last_name" defaultValue={profile.last_name ?? ''} key={`ln-${profile.last_name}`} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_display">E-mailadres</Label>
                  <Input id="email_display" value={profile.email} disabled className="h-10 bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ''} key={`ph-${profile.phone}`} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Geboortedatum</Label>
                  <Input id="birth_date" name="birth_date" type="date" defaultValue={profile.birth_date ?? ''} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input id="address" name="address" defaultValue={profile.address ?? ''} className="h-10" />
                </div>
                <div className="sm:col-span-2 mt-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="share_phone" defaultChecked={profile.share_phone ?? false} className="h-4 w-4 rounded border-gray-300 text-primary" />
                    <span className="text-sm font-medium">Mijn telefoonnummer delen met tegenstanders</span>
                  </label>
                </div>
              </div>
              {saveMsg && (
                <p className={`text-sm font-semibold flex items-center gap-1.5 ${saveMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {saveMsg.text}
                </p>
              )}
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isPending} className="font-bold">
                  {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opslaan...</> : 'Opslaan'}
                </Button>
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
            <form action={handlePasswordSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">Nieuw wachtwoord</Label>
                <Input id="new_password" name="new_password" type="password" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Bevestig wachtwoord</Label>
                <Input id="confirm_password" name="confirm_password" type="password" className="h-10" />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="outline" disabled={isPwPending} className="font-bold w-full">
                  {isPwPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Wijzigen...</> : 'Wachtwoord wijzigen'}
                </Button>
              </div>
              {pwMsg && (
                <div className="sm:col-span-3">
                  <p className={`text-sm font-semibold flex items-center gap-1.5 ${pwMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {pwMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {pwMsg.text}
                  </p>
                </div>
              )}
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
          <CardContent>
            <form action={handleNotificationSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allowedNotifications.map((item) => (
                  <label key={item.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="notifications"
                      value={item.value}
                      defaultChecked={userNotifications.includes(item.value) || userNotifications.length === 0}
                      className="h-4 w-4 rounded border-gray-300 text-primary"
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isPending} className="font-bold">
                  {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opslaan...</> : 'Meldingen Opslaan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
