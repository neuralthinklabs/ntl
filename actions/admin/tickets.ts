'use server'

import { z } from 'zod'
import { and, eq, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { events, eventRegistrations, ticketTypes } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { zonedLocalToDate } from '@/lib/tz'
import type { ActionState } from '../auth'

const schema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2, 'Name the ticket, e.g. General or Student.').max(80),
  description: z.string().trim().max(300).optional(),
  quantity: z.coerce.number().int().positive('Quantity must be 1 or more.').max(100000).optional(),
  salesStart: z.string().optional(),
  salesEnd: z.string().optional(),
})

function refresh(eventId: string, slug?: string) {
  revalidatePath(`/admin/events/${eventId}`)
  revalidatePath('/events')
  if (slug) revalidatePath(`/events/${slug}`)
}

/** Free tickets only for now: price is always 0 until payments exist. */
export async function addTicketType(
  eventId: string,
  input: { name: string; description: string; quantity: string; salesStart: string; salesEnd: string },
): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = schema.safeParse({
      eventId,
      name: input.name,
      description: input.description || undefined,
      quantity: input.quantity || undefined,
      salesStart: input.salesStart || undefined,
      salesEnd: input.salesEnd || undefined,
    })
    if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
    const ev = await db.query.events.findFirst({ where: eq(events.id, p.data.eventId) })
    if (!ev) return { error: 'Event not found.' }

    const start = p.data.salesStart ? zonedLocalToDate(p.data.salesStart, ev.timezone) : null
    const end = p.data.salesEnd ? zonedLocalToDate(p.data.salesEnd, ev.timezone) : null
    if ((p.data.salesStart && !start) || (p.data.salesEnd && !end)) return { error: 'The sales dates are not valid.' }
    if (start && end && end <= start) return { error: 'Sales must close after they open.' }

    const existing = await db.query.ticketTypes.findMany({ where: eq(ticketTypes.eventId, ev.id) })
    await db.insert(ticketTypes).values({
      eventId: ev.id,
      name: p.data.name,
      description: p.data.description ?? null,
      priceCents: 0,
      quantity: p.data.quantity ?? null,
      salesStart: start,
      salesEnd: end,
      sortOrder: existing.reduce((m, x) => Math.max(m, x.sortOrder), 0) + 1,
    })
    await logAdmin({ actorId: admin.id, action: 'ticket_add', entity: 'event', entityId: ev.id, summary: p.data.name })
    refresh(ev.id, ev.slug)
    return { success: 'Ticket added.' }
  })
}

export async function deleteTicketType(id: string, eventId: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = z.object({ id: z.string().uuid(), eventId: z.string().uuid() }).parse({ id, eventId })
    const [{ n }] = await db.select({ n: count() }).from(eventRegistrations).where(eq(eventRegistrations.ticketTypeId, p.id))
    if (n > 0) return { error: 'People already hold this ticket, so it cannot be removed. Set a sales end date instead.' }
    await db.delete(ticketTypes).where(and(eq(ticketTypes.id, p.id), eq(ticketTypes.eventId, p.eventId)))
    await logAdmin({ actorId: admin.id, action: 'ticket_delete', entity: 'event', entityId: p.eventId, summary: p.id })
    const ev = await db.query.events.findFirst({ where: eq(events.id, p.eventId) })
    refresh(p.eventId, ev?.slug)
    return { success: 'Ticket removed.' }
  })
}
