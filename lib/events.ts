import { asc, desc, gte, lt } from 'drizzle-orm'
import { db } from '@/db'
import { events } from '@/db/schema'

// P2 #15: /events previously rendered from lib/data.ts mock arrays even
// though the `events` / `event_registrations` tables already existed in
// the schema and migration. This queries the real tables instead.

export type EventCardData = {
  id: string
  slug: string
  month: string
  day: string
  title: string
  meta: string
  description: string
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function toCard(e: typeof events.$inferSelect): EventCardData {
  const start = new Date(e.startsAt)
  const timeRange = e.endsAt ? `${formatTime(start)} – ${formatTime(new Date(e.endsAt))}` : formatTime(start)
  const where = e.isOnline ? 'Online' : e.location || 'Location TBA'

  return {
    id: e.id,
    slug: e.slug,
    month: start.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    day: String(start.getDate()),
    title: e.title,
    meta: `${where} · ${timeRange}`,
    description: e.description ?? '',
  }
}

export async function getUpcomingEvents(limit = 20) {
  const rows = await db.query.events.findMany({
    where: gte(events.startsAt, new Date()),
    orderBy: [asc(events.startsAt)],
    limit,
  })
  return rows.map(toCard)
}

export async function getPastEvents(limit = 20) {
  const rows = await db.query.events.findMany({
    where: lt(events.startsAt, new Date()),
    orderBy: [desc(events.startsAt)],
    limit,
  })
  return rows.map(toCard)
}
