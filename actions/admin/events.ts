'use server'

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { events, eventRegistrations } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { slugify } from '@/lib/slug'
import { isValidTimeZone, zonedLocalToDate } from '@/lib/tz'
import { awardPoints } from '@/lib/points'
import { promoteFromWaitlist } from '@/lib/waitlist'
import type { ActionState } from '../auth'

const eventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(200),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(200).optional(),
  isOnline: z.boolean(),
  timezone: z.string().trim().min(1),
  startsAt: z.string().min(1, 'Choose a start date and time.'),
  endsAt: z.string().optional(),
  capacity: z.coerce.number().int().positive().max(100000).optional(),
})

function refresh() {
  revalidatePath('/')
  revalidatePath('/events')
  revalidatePath('/admin/events')
}

export async function saveEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async () => {
    const parsed = eventSchema.safeParse({
      id: formData.get('id') || undefined,
      title: formData.get('title'),
      slug: formData.get('slug') || undefined,
      description: formData.get('description') || undefined,
      location: formData.get('location') || undefined,
      isOnline: formData.get('isOnline') === 'on',
      timezone: formData.get('timezone'),
      startsAt: formData.get('startsAt'),
      endsAt: formData.get('endsAt') || undefined,
      capacity: formData.get('capacity') || undefined,
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    const d = parsed.data

    if (!isValidTimeZone(d.timezone)) return { error: 'Enter a valid time zone, e.g. Asia/Kolkata or UTC.' }
    const startsAt = zonedLocalToDate(d.startsAt, d.timezone)
    if (!startsAt) return { error: 'The start date and time are not valid.' }
    const endsAt = d.endsAt ? zonedLocalToDate(d.endsAt, d.timezone) : null
    if (d.endsAt && !endsAt) return { error: 'The end date and time are not valid.' }
    if (endsAt && endsAt <= startsAt) return { error: 'The end must be after the start.' }

    const slug = slugify(d.slug || d.title)
    if (!slug) return { error: 'Add a title or slug with letters or numbers.' }

    const values = {
      slug,
      title: d.title,
      description: d.description ?? null,
      location: d.isOnline ? null : (d.location ?? null),
      isOnline: d.isOnline,
      timezone: d.timezone,
      startsAt,
      endsAt,
      capacity: d.capacity ?? null,
    }

    if (d.id) {
      await db.update(events).set(values).where(eq(events.id, d.id))
      refresh()
      return { success: 'Saved.' }
    }
    const [row] = await db.insert(events).values(values).returning({ id: events.id })
    refresh()
    redirect(`/admin/events/${row.id}?created=1`)
  })
}

export async function deleteEvent(id: string): Promise<ActionState> {
  return runAdmin(async () => {
    await db.delete(events).where(eq(events.id, id))
    refresh()
    redirect('/admin/events')
  })
}

const POINTS_FOR_ATTENDING = 20

export async function setRegistrationStatus(
  eventId: string,
  userId: string,
  status: 'registered' | 'waitlisted' | 'cancelled' | 'attended',
): Promise<ActionState> {
  return runAdmin(async () => {
    z.object({ eventId: z.string().uuid(), userId: z.string().uuid() }).parse({ eventId, userId })

    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(eventRegistrations)
        .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)))
      if (!before) throw new Error('Registration not found')

      await tx
        .update(eventRegistrations)
        .set({ status })
        .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)))

      // Points are awarded once, on the transition into "attended".
      if (status === 'attended' && before.status !== 'attended') {
        const [ev] = await tx.select({ title: events.title }).from(events).where(eq(events.id, eventId))
        await awardPoints({
          executor: tx,
          userId,
          points: POINTS_FOR_ATTENDING,
          type: 'event_attended',
          title: `Attended: ${ev?.title ?? 'an event'}`,
          meta: `Event attended · +${POINTS_FOR_ATTENDING} pts`,
          relatedId: eventId,
        })
      }
    })

    // An admin cancelling someone frees a seat too.
    if (status === 'cancelled') await promoteFromWaitlist(eventId)

    revalidatePath('/events')
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath('/dashboard')
    return { success: 'Updated.' }
  })
}

