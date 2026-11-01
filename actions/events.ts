'use server'

import { z } from 'zod'
import { and, asc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { events, eventRegistrations, profiles, ticketTypes } from '@/db/schema'
import { sendEmail, eventRegistrationEmail, escapeHtml } from '@/lib/email'
import { awardPoints } from '@/lib/points'
import { eventWhere, formatEventWhen } from '@/lib/events'
import { promoteFromWaitlist } from '@/lib/waitlist'
import type { ActionState } from './auth'

const idSchema = z.string().uuid()

class UserError extends Error {}

/**
 * Register for an event. If the event has ticket types, `ticketTypeId` must be
 * one of them; if it has none, this is plain registration. Every registration
 * gets a ticket code (made by the database) used for check-in.
 */
export async function registerForEvent(eventId: string, ticketTypeId?: string | null): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please log in to register.' }
  if (!idSchema.safeParse(eventId).success) return { error: 'Event not found.' }
  if (ticketTypeId && !idSchema.safeParse(ticketTypeId).success) return { error: 'Ticket not found.' }

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event) return { error: 'Event not found.' }
  if (event.startsAt < new Date()) return { error: 'This event has already started.' }
  if (event.registrationClosesAt && event.registrationClosesAt < new Date()) return { error: 'Registration for this event has closed.' }

  await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? '' })
    .onConflictDoNothing({ target: profiles.id })

  let result: { status: string; isNew: boolean; code: string; ticketName: string | null }
  try {
    result = await db.transaction(async (tx) => {
      // Lock the event row so two people cannot take the last seat/ticket at once.
      await tx.execute(sql`select id from events where id = ${event.id} for update`)

      const [mine] = await tx
        .select()
        .from(eventRegistrations)
        .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.userId, user.id)))
      if (mine && mine.status !== 'cancelled') return { status: mine.status, isNew: false, code: mine.ticketCode, ticketName: null }

      const types = await tx.select().from(ticketTypes).where(eq(ticketTypes.eventId, event.id)).orderBy(asc(ticketTypes.sortOrder))
      let ticket: (typeof types)[number] | null = null
      if (types.length) {
        ticket = types.find((t) => t.id === ticketTypeId) ?? null
        if (!ticket) throw new UserError('Choose a ticket first.')
        const now = new Date()
        if (ticket.salesStart && ticket.salesStart > now) throw new UserError('Sales for this ticket have not opened yet.')
        if (ticket.salesEnd && ticket.salesEnd < now) throw new UserError('Sales for this ticket have ended.')
        if (ticket.priceCents > 0) throw new UserError('Paid tickets are not available yet.')
        if (ticket.quantity) {
          const [{ n }] = await tx
            .select({ n: sql<number>`count(*)::int` })
            .from(eventRegistrations)
            .where(and(eq(eventRegistrations.ticketTypeId, ticket.id), sql`${eventRegistrations.status} in ('registered','attended')`))
          if (n >= ticket.quantity) throw new UserError('This ticket is sold out.')
        }
      }

      let status: 'registered' | 'waitlisted' = 'registered'
      if (event.capacity) {
        const [{ n }] = await tx
          .select({ n: sql<number>`count(*)::int` })
          .from(eventRegistrations)
          .where(and(eq(eventRegistrations.eventId, event.id), sql`${eventRegistrations.status} in ('registered','attended')`))
        if (n >= event.capacity) status = 'waitlisted'
      }

      let code: string
      if (mine) {
        const [row] = await tx
          .update(eventRegistrations)
          .set({ status, ticketTypeId: ticket?.id ?? null, registeredAt: new Date() })
          .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.userId, user.id)))
          .returning({ code: eventRegistrations.ticketCode })
        code = row.code
      } else {
        const [row] = await tx
          .insert(eventRegistrations)
          .values({ eventId: event.id, userId: user.id, status, ticketTypeId: ticket?.id ?? null })
          .returning({ code: eventRegistrations.ticketCode })
        code = row.code
      }

      if (status === 'registered') {
        await awardPoints({
          executor: tx,
          userId: user.id,
          points: 0,
          type: 'event_registered',
          title: `Registered: ${event.title}`,
          meta: ticket ? `Ticket: ${ticket.name}` : 'Event registration',
          relatedId: event.id,
        })
      }
      return { status, isNew: true, code, ticketName: ticket?.name ?? null }
    })
  } catch (e) {
    if (e instanceof UserError) return { error: e.message }
    throw e
  }

  if (result.isNew && user.email) {
    const waitlisted = result.status === 'waitlisted'
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
    const ticketBlock = waitlisted
      ? ''
      : `<div style="font-family:sans-serif;max-width:520px;margin:12px auto 0;color:#0d0f12;line-height:1.55"><p>${result.ticketName ? `Ticket: <strong>${escapeHtml(result.ticketName)}</strong><br/>` : ''}Your ticket code: <strong style="font-family:monospace;font-size:16px">${escapeHtml(result.code)}</strong></p><p>Show this code at check-in. You can also find it under My tickets${base ? ` (<a href="${escapeHtml(`${base}/tickets`)}">open</a>)` : ''}.</p></div>`
    await sendEmail({
      to: user.email,
      subject: `${waitlisted ? 'Waitlisted' : 'Registered'}: ${event.title}`,
      html: eventRegistrationEmail(event.title, formatEventWhen(event), eventWhere(event), waitlisted) + ticketBlock,
    })
  }

  revalidatePath('/events')
  revalidatePath(`/events/${event.slug}`)
  revalidatePath('/tickets')
  revalidatePath('/dashboard')
  revalidatePath(`/admin/events/${event.id}`)
  return {
    success: result.status === 'waitlisted' ? 'The event is full: you are on the waitlist.' : 'You are registered.',
  }
}

export async function cancelRegistration(eventId: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please log in.' }
  if (!idSchema.safeParse(eventId).success) return { error: 'Event not found.' }

  await db
    .update(eventRegistrations)
    .set({ status: 'cancelled' })
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, user.id),
        sql`${eventRegistrations.status} in ('registered','waitlisted')`,
      ),
    )

  // A freed seat goes to the longest-waiting person on the waitlist.
  await promoteFromWaitlist(eventId)

  revalidatePath('/events')
  revalidatePath('/tickets')
  revalidatePath(`/admin/events/${eventId}`)
  return { success: 'Registration cancelled.' }
}
