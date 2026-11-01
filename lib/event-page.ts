import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventRegistrations, ticketTypes } from '@/db/schema'

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

/** This person's registration (undefined if none or cancelled), with the ticket name. */
export async function getMyRegistration(eventId: string, userId: string) {
  const [r] = await db
    .select({ status: eventRegistrations.status, code: eventRegistrations.ticketCode, ticketName: ticketTypes.name })
    .from(eventRegistrations)
    .leftJoin(ticketTypes, eq(eventRegistrations.ticketTypeId, ticketTypes.id))
    .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)))
  return r && r.status !== 'cancelled' ? r : undefined
}

export type TicketOption = {
  id: string
  name: string
  description: string
  left: number | null
  state: 'open' | 'soon' | 'closed' | 'soldout'
}

/** Ticket types with live availability. Empty list = plain registration. */
export async function getTickets(eventId: string): Promise<TicketOption[]> {
  const rows = await db
    .select({
      t: ticketTypes,
      sold: sql<number>`count(${eventRegistrations.userId}) filter (where ${eventRegistrations.status} in ('registered','attended'))::int`,
    })
    .from(ticketTypes)
    .leftJoin(eventRegistrations, eq(eventRegistrations.ticketTypeId, ticketTypes.id))
    .where(eq(ticketTypes.eventId, eventId))
    .groupBy(ticketTypes.id)
    .orderBy(asc(ticketTypes.sortOrder))
  const now = new Date()
  return rows.map(({ t, sold }) => {
    const left = t.quantity ? Math.max(0, t.quantity - sold) : null
    const state: TicketOption['state'] =
      t.salesStart && t.salesStart > now ? 'soon' : t.salesEnd && t.salesEnd < now ? 'closed' : left === 0 ? 'soldout' : 'open'
    return { id: t.id, name: t.name, description: t.description ?? '', left, state }
  })
}
