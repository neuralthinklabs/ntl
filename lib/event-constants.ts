// Safe to import from client components (no DB imports).
export const EVENT_KINDS = ['event', 'workshop', 'talk', 'meetup', 'hackathon'] as const
export type EventKind = (typeof EVENT_KINDS)[number]
export const KIND_LABEL: Record<string, string> = {
  event: 'Event',
  workshop: 'Workshop',
  talk: 'Talk',
  meetup: 'Meetup',
  hackathon: 'Hackathon',
}

export const EVENT_FORMATS = ['online', 'in_person', 'hybrid'] as const
export type EventFormat = (typeof EVENT_FORMATS)[number]
export const FORMAT_LABEL: Record<EventFormat, string> = { online: 'Online', in_person: 'In person', hybrid: 'Hybrid (online and in person)' }

/** Stored as is_online + location: online = link only, in person = venue only, hybrid = both. */
export function formatOf(e: { isOnline: boolean; location: string | null }): EventFormat {
  if (e.isOnline && e.location) return 'hybrid'
  return e.isOnline ? 'online' : 'in_person'
}

export function providerLabel(url: string | null | undefined) {
  try {
    const h = new URL(url ?? '').hostname.toLowerCase()
    if (h === 'zoom.us' || h.endsWith('.zoom.us')) return 'Zoom'
    if (h === 'meet.google.com') return 'Google Meet'
    if (h === 'teams.microsoft.com' || h === 'teams.live.com') return 'Microsoft Teams'
  } catch {
    /* fall through */
  }
  return 'the meeting'
}
