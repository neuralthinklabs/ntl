import { and, asc, desc, eq, gte, lt } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventRegistrations } from '@/db/schema'

export type EventCardData = {
  id: string
  slug: string
  month: string
  day: string
  title: string
  meta: string
  description: string
  full: boolean
}

type EventRow = typeof events.$inferSelect

// Always format in the event's own zone so every visitor sees the same
// wall-clock time, regardless of where the server or the visitor is.
function fmt(d: Date, tz: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).format(d)
}

export function formatEventWhen(e: Pick<EventRow, 'startsAt' | 'endsAt' | 'timezone'>) {
  const start = new Date(e.startsAt)
  const date = fmt(start, e.timezone, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const t = (d: Date) => fmt(d, e.timezone, { hour: 'numeric', minute: '2-digit' })
  const zone = fmt(start, e.timezone, { timeZoneName: 'short' }).split(', ').pop()
  const range = e.endsAt ? `${t(start)} – ${t(new Date(e.endsAt))}` : t(start)
  return `${date}, ${range} ${zone}`
}

function toCard(e: EventRow, taken: number): EventCardData {
  const start = new Date(e.startsAt)
  const where = e.isOnline ? 'Online' : e.location || 'Location to be announced'
  return {
    id: e.id,
    slug: e.slug,
    month: fmt(start, e.timezone, { month: 'short' }).toUpperCase(),
    day: fmt(start, e.timezone, { day: 'numeric' }),
    title: e.title,
    meta: `${where} — ${formatEventWhen(e)}`,
    description: e.description ?? '',
    full: !!e.capacity && taken >= e.capacity,
  }
}

async function takenCounts(ids: string[]) {
  const map = new Map<string, number>()
  if (!ids.length) return map
  const rows = await db.query.eventRegistrations.findMany({
    where: (r, { inArray, and: a }) => a(inArray(r.eventId, ids), inArray(r.status, ['registered', 'attended'])),
    columns: { eventId: true },
  })
  for (const r of rows) map.set(r.eventId, (map.get(r.eventId) ?? 0) + 1)
  return map
}

export async function getUpcomingEvents(limit = 20) {
  const rows = await db.query.events.findMany({
    where: gte(events.startsAt, new Date()),
    orderBy: [asc(events.startsAt)],
    limit,
  })
  const taken = await takenCounts(rows.map((r) => r.id))
  return rows.map((r) => toCard(r, taken.get(r.id) ?? 0))
}

export async function getPastEvents(limit = 20) {
  const rows = await db.query.events.findMany({
    where: lt(events.startsAt, new Date()),
    orderBy: [desc(events.startsAt)],
    limit,
  })
  return rows.map((r) => toCard(r, 0))
}

/** Map eventId -> this user's registration status (excluding cancelled). */
export async function getMyRegistrations(userId: string) {
  const rows = await db.query.eventRegistrations.findMany({
    where: and(eq(eventRegistrations.userId, userId)),
  })
  return Object.fromEntries(rows.filter((r) => r.status !== 'cancelled').map((r) => [r.eventId, r.status]))
}
