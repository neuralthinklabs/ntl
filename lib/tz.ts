// Time-zone helpers with no dependencies. Admins enter event times as
// wall-clock time in the event's own time zone; we store the UTC instant and
// always render with that zone, so every visitor sees the same correct time.

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

function parts(date: Date, tz: string) {
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
  for (const x of dtf.formatToParts(date)) p[x.type] = x.value
  return p
}

function offsetMs(date: Date, tz: string): number {
  const p = parts(date, tz)
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/** "2026-11-05T18:30" interpreted in `tz` -> the real UTC instant. */
export function zonedLocalToDate(local: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local)
  if (!m || !isValidTimeZone(tz)) return null
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  let ts = guess - offsetMs(new Date(guess), tz)
  ts = guess - offsetMs(new Date(ts), tz)
  return new Date(ts)
}

/** UTC instant -> "YYYY-MM-DDTHH:mm" wall-clock in `tz` (for <input type=datetime-local>). */
export function dateToZonedLocal(date: Date, tz: string): string {
  const p = parts(date, tz)
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}
