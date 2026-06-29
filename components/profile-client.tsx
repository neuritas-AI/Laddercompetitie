'use client'

import { useState, useTransition, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Lock, Bell, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { updateProfile, updatePassword, uploadAvatar } from '@/app/actions/profile'

interface Profile {
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  address: string | null
  birth_date: string | null
  avatar_url: string | null
}

interface Props {
  profile: Profile
}

export default function ProfileClient({ profile }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isPwPending, startPwTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
  const initials = displayName.slice(0, 2).toUpperCase()

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
        setSaveMsg({ type: 'success', text: 'Profiel opgeslagen!' })
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">Mijn Profiel</h1>
        <p className="text-muted-foreground">Beheer je persoonlijke gegevens en voorkeuren.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar Card */}
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
            <AvatarImage src={avatarUrl} alt="Profiel foto" className="object-cover" />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{displayName}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <div className="relative">
            <Button variant="outline" size="sm" className="flex items-center gap-2 font-bold cursor-pointer relative" disabled={uploading}>
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
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">JPEG of PNG, max 2MB</p>
          </div>
          {uploadMsg && (
            <p className={`text-sm font-semibold flex items-center gap-1.5 ${uploadMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {uploadMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {uploadMsg.text}
            </p>
          )}
        </Card>

        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Persoonlijke gegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleProfileSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Voornaam</Label>
                  <Input id="first_name" name="first_name" defaultValue={profile.first_name ?? ''} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Achternaam</Label>
                  <Input id="last_name" name="last_name" defaultValue={profile.last_name ?? ''} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ''} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Geboortedatum</Label>
                  <Input id="birth_date" name="birth_date" type="date" defaultValue={profile.birth_date ?? ''} className="h-10" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input id="address" name="address" defaultValue={profile.address ?? ''} className="h-10" />
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
