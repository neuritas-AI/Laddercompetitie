const TIME_ZONE = 'Europe/Brussels'

function pad(value: number) {
  return String(value).padStart(2, '0')
}

type DateParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function getTimeZoneParts(date: Date | string, timeZone: string = TIME_ZONE): DateParts {
  const dt = typeof date === 'string' ? new Date(date) : date
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(dt)
  const values: Record<string, string> = {}

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

function formatDateInBrussels(date: Date | string, options: Intl.DateTimeFormatOptions) {
  const dt = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('nl-BE', { timeZone: TIME_ZONE, ...options }).format(dt)
}

function parseBrusselsLocalDateTime(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)

  if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
    throw new Error('Ongeldige datum of tijd')
  }

  const target = { year, month, day, hour, minute }
  const start = Date.UTC(year, month - 1, day, 0, 0, 0) - 24 * 60 * 60 * 1000
  const end = Date.UTC(year, month - 1, day, 23, 59, 0) + 24 * 60 * 60 * 1000

  for (let timestamp = start; timestamp <= end; timestamp += 60_000) {
    const parts = getTimeZoneParts(new Date(timestamp), TIME_ZONE)
    if (
      parts.year === target.year &&
      parts.month === target.month &&
      parts.day === target.day &&
      parts.hour === target.hour &&
      parts.minute === target.minute
    ) {
      return new Date(timestamp)
    }
  }

  throw new Error('Kan Brussels lokale datum en tijd niet omzetten naar UTC')
}

function getStartOfBrusselsDay(date: Date | string) {
  const parts = getTimeZoneParts(date, TIME_ZONE)
  return parseBrusselsLocalDateTime(
    `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    '00:00'
  )
}

function getEndOfBrusselsDay(date: Date | string) {
  const parts = getTimeZoneParts(date, TIME_ZONE)
  const startOfLastMinute = parseBrusselsLocalDateTime(
    `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    '23:59'
  )
  return new Date(startOfLastMinute.getTime() + 59_999)
}

export {
  TIME_ZONE,
  formatDateInBrussels,
  parseBrusselsLocalDateTime,
  getStartOfBrusselsDay,
  getEndOfBrusselsDay,
}
