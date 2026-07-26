// Client-side .ics generation so a scheduled match can be added to Apple
// Calendar, Google Calendar, Outlook, or any other calendar app that accepts
// the standard iCalendar format — no server round-trip needed.

const DEFAULT_DURATION_MINUTES = 90

function toIcsDateUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcsText(value: string): string {
  return value.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
}

export function generateMatchIcs({
  matchId,
  scheduledDate,
  opponentName,
}: {
  matchId: string
  scheduledDate: string
  opponentName: string
}): string {
  const start = new Date(scheduledDate)
  const end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TPA Ladder//NL',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:match-${matchId}@tpaladder`,
    `DTSTAMP:${toIcsDateUtc(new Date())}`,
    `DTSTART:${toIcsDateUtc(start)}`,
    `DTEND:${toIcsDateUtc(end)}`,
    `SUMMARY:${escapeIcsText('TPA Ladder – Wedstrijd')}`,
    `DESCRIPTION:${escapeIcsText(`Wedstrijd tegen ${opponentName}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

export function downloadIcsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
