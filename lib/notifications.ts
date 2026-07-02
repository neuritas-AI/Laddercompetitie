export type NotificationType = 'match_tomorrow' | 'match_today' | 'score_entered' | 'match_scheduled' | 'score_confirmed'

export function normalizeNotificationLink(linkUrl: string | undefined, type: NotificationType, matchId?: string) {
  if (linkUrl && linkUrl.startsWith('/') && !linkUrl.startsWith('//')) {
    return linkUrl
  }

  switch (type) {
    case 'score_entered':
      // Use a redirect-friendly path to ensure the notification always lands on an existing page
      return matchId ? `/matches/redirect/${matchId}/confirm` : '/matches'
    case 'match_scheduled':
    case 'match_tomorrow':
    case 'match_today':
    case 'score_confirmed':
      return matchId ? `/matches/redirect/${matchId}` : '/matches'
    default:
      return '/matches'
  }
}
