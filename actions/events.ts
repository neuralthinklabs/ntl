'use server'

import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { events, eventRegistrations, profiles } from '@/db/schema'
import { sendEmail, eventRegistrationEmail } from '@/lib/email'
import { awardPoints } from '@/lib/points'
import { formatEventWhen } from '@/lib/events'
import type { ActionState } from './auth'

const idSchema = z.string().uuid()

export async function registerForEvent(eventId: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please log in to register.' }
  if (!idSchema.safeParse(eventId).success) return { error: 'Event not found.' }

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event) return { error: 'Event not found.' }
  if (event.startsAt < new Date()) return { error: 'This event has already started.' }

  await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? '' })
    .onConflictDoNothing({ target: profiles.id })

  const result = await db.transaction(async (tx) => {
    // Lock the event row so two people cannot take the last seat at once.
    await tx.execute(sql`select id from events where id = ${event.id} for update`)

    const [mine] = await tx
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.userId, user.id)))
    if (mine && mine.status !== 'cancelled') return { status: mine.status, isNew: false }

    let status: 'registered' | 'waitlisted' = 'registered'
    if (event.capacity) {
      const [{ n }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, event.id),
            sql`${eventRegistrations.status} in ('registered','attended')`,
          ),
        )
      if (n >= event.capacity) status = 'waitlisted'
    }

    if (mine) {
      await tx
        .update(eventRegistrations)
        .set({ status, registeredAt: new Date() })
        .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.userId, user.id)))
    } else {
      await tx.insert(eventRegistrations).values({ eventId: event.id, userId: user.id, status })
    }

    if (status === 'registered') {
      await awardPoints({
        executor: tx,
        userId: user.id,
        points: 0,
        type: 'event_registered',
        title: `Registered: ${event.title}`,
        meta: 'Event registration',
        relatedId: event.id,
      })
    }
    return { status, isNew: true }
  })

  if (result.isNew && user.email) {
    await sendEmail({
      to: user.email,
      subject: `${result.status === 'waitlisted' ? 'Waitlisted' : 'Registered'}: ${event.title}`,
      html: eventRegistrationEmail(
        event.title,
        formatEventWhen(event),
        event.isOnline ? 'Online' : (event.location ?? 'Location to be announced'),
        result.status === 'waitlisted',
      ),
    })
  }

  revalidatePath('/events')
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

  revalidatePath('/events')
  revalidatePath(`/admin/events/${eventId}`)
  return { success: 'Registration cancelled.' }
}
