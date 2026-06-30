export interface ProfileName {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

export function getDisplayName(profile: ProfileName): string {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
  return name || 'Speler'
}

export function getInitials(profile: ProfileName): string {
  const first = profile.first_name?.trim()
  const last = profile.last_name?.trim()
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase()
  if (first) return first.slice(0, 2).toUpperCase()
  if (last) return last.slice(0, 2).toUpperCase()
  return 'SP'
}
