export interface ProfileRecord {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  birth_date: string | null
  avatar_url: string | null
  share_phone?: boolean | null
  preferences?: { notifications?: string[] } | null
  role?: string | null
}
