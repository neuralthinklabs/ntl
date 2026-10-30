// Minimal RFC 5545 calendar file for one event.
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

// Lines longer than 75 characters must be folded.
function fold(line: string) {
  const out: string[] = []
  let rest = line
  while (rest.length > 73) {
    out.push(rest.slice(0, 73))
    rest = ' ' + rest.slice(73)
  }
  out.push(rest)
  return out.join('\r\n')
}

export function buildIcs(e: {
  uid: string
  title: string
  description?: string | null
  location?: string | null
  url?: string
  startsAt: Date
  endsAt?: Date | null
}) {
  const end = e.endsAt ?? new Date(e.startsAt.getTime() + 60 * 60 * 1000)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Neural Think Labs//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}@neuralthinklabs`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.startsAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    ...(e.description ? [`DESCRIPTION:${esc(e.description.slice(0, 1500))}`] : []),
    ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
    ...(e.url ? [`URL:${e.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}
