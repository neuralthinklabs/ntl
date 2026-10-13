// Timezone-safe helpers. Events store an IANA timezone; admins enter local
// wall-clock times in that zone and we convert to/from UTC explicitly instead
// of relying on whatever timezone the server happens to run in.

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

function offsetMs(date: Date, tz: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const p: Record<string, string> = {}
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/** "2026-11-05T09:30" (wall clock in `tz`) -> the matching UTC instant. */
export function zonedLocalToUtc(local: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local)
  if (!m || !isValidTimeZone(tz)) return null
  const [, y, mo, d, h, mi] = m.map(Number) as unknown as number[]
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const off1 = offsetMs(new Date(guess), tz)
  let utc = guess - off1
  const off2 = offsetMs(new Date(utc), tz)
  if (off2 !== off1) utc = guess - off2
  return new Date(utc)
}

/** UTC instant -> "YYYY-MM-DDTHH:mm" wall clock in `tz` (for <input type=datetime-local>). */
export function utcToZonedInput(date: Date, tz: string): string {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const p: Record<string, string> = {}
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

export function formatInZone(date: Date, tz: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).format(date)
}

/** Stable, timezone-explicit date formatting for server-rendered content. */
export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts }).format(new Date(date))
}
