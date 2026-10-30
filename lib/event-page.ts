import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventRegistrations } from '@/db/schema'

export async function getEventBySlug(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null
  return (await db.query.events.findFirst({ where: eq(events.slug, slug) })) ?? null
}

/** Seats taken (registered + attended; waitlisted people do not count). */
export async function getTakenCount(eventId: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, eventId), sql`${eventRegistrations.status} in ('registered','attended')`))
  return r?.n ?? 0
}

/** This person's registration status for the event (undefined if none or cancelled). */
export async function getMyStatus(eventId: string, userId: string) {
  const r = await db.query.eventRegistrations.findFirst({
    where: and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)),
  })
  return r && r.status !== 'cancelled' ? r.status : undefined
}
