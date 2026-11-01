'use server'

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { events, eventRegistrations, profiles } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { slugify } from '@/lib/slug'
import { isValidTimeZone, zonedLocalToDate } from '@/lib/tz'
import { awardPoints } from '@/lib/points'
import { checkAchievements } from '@/lib/achievements'
import { promoteFromWaitlist } from '@/lib/waitlist'
import { EVENT_FORMATS, EVENT_KINDS } from '@/lib/event-constants'
import type { ActionState } from '../auth'

const httpsUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(500)
    .url(`Enter a valid ${label}.`)
    .refine((u) => u.startsWith('https://'), `The ${label} must start with https://`)
    .optional()

const eventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(200),
  slug: z.string().trim().max(80).optional(),
  kind: z.enum(EVENT_KINDS),
  description: z.string().trim().max(5000).optional(),
  format: z.enum(EVENT_FORMATS),
  location: z.string().trim().max(200).optional(),
  venueAddress: z.string().trim().max(300).optional(),
  venueMapUrl: httpsUrl('map link'),
  meetingUrl: httpsUrl('meeting link'),
  timezone: z.string().trim().min(1),
  startsAt: z.string().min(1, 'Choose a start date and time.'),
  endsAt: z.string().optional(),
  registrationClosesAt: z.string().optional(),
  capacity: z.coerce.number().int().positive().max(100000).optional(),
  teamMin: z.coerce.number().int().min(1).max(50).optional(),
  teamMax: z.coerce.number().int().min(1).max(50).optional(),
  submissionDeadline: z.string().optional(),
})

function refresh() {
  revalidatePath('/')
  revalidatePath('/events')
  revalidatePath('/admin/events')
}

export async function saveEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const f = (k: string) => (formData.get(k) as string) || undefined
    const parsed = eventSchema.safeParse({
      id: f('id'),
      title: formData.get('title'),
      slug: f('slug'),
      kind: formData.get('kind') || 'event',
      description: f('description'),
      format: formData.get('format') || 'online',
      location: f('location'),
      venueAddress: f('venueAddress'),
      venueMapUrl: f('venueMapUrl'),
      meetingUrl: f('meetingUrl'),
      timezone: formData.get('timezone'),
      startsAt: formData.get('startsAt'),
      endsAt: f('endsAt'),
      registrationClosesAt: f('registrationClosesAt'),
      capacity: f('capacity'),
      teamMin: f('teamMin'),
      teamMax: f('teamMax'),
      submissionDeadline: f('submissionDeadline'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    const d = parsed.data

    if (!isValidTimeZone(d.timezone)) return { error: 'Enter a valid time zone, e.g. Asia/Kolkata or UTC.' }
    const startsAt = zonedLocalToDate(d.startsAt, d.timezone)
    if (!startsAt) return { error: 'The start date and time are not valid.' }
    const endsAt = d.endsAt ? zonedLocalToDate(d.endsAt, d.timezone) : null
    if (d.endsAt && !endsAt) return { error: 'The end date and time are not valid.' }
    if (endsAt && endsAt <= startsAt) return { error: 'The end must be after the start.' }
    const closes = d.registrationClosesAt ? zonedLocalToDate(d.registrationClosesAt, d.timezone) : null
    if (d.registrationClosesAt && !closes) return { error: 'The registration close time is not valid.' }
    if (closes && closes > (endsAt ?? startsAt)) return { error: 'Registration must close before the event ends.' }

    const inPerson = d.format !== 'online'
    if (inPerson && !d.location) return { error: 'Add the venue name for an in-person or hybrid event.' }

    const hack = d.kind === 'hackathon'
    if (hack && d.teamMin && d.teamMax && d.teamMin > d.teamMax) return { error: 'Minimum team size cannot be larger than the maximum.' }
    const deadline = hack && d.submissionDeadline ? zonedLocalToDate(d.submissionDeadline, d.timezone) : null
    if (hack && d.submissionDeadline && !deadline) return { error: 'The submission deadline is not valid.' }

    const slug = slugify(d.slug || d.title)
    if (!slug) return { error: 'Add a title or slug with letters or numbers.' }

    const values = {
      slug,
      title: d.title,
      kind: d.kind,
      description: d.description ?? null,
      isOnline: d.format !== 'in_person',
      location: inPerson ? (d.location ?? null) : null,
      venueAddress: inPerson ? (d.venueAddress ?? null) : null,
      venueMapUrl: inPerson ? (d.venueMapUrl ?? null) : null,
      meetingUrl: d.format !== 'in_person' ? (d.meetingUrl ?? null) : null,
      timezone: d.timezone,
      startsAt,
      endsAt,
      registrationClosesAt: closes,
      capacity: d.capacity ?? null,
      teamMin: hack ? (d.teamMin ?? null) : null,
      teamMax: hack ? (d.teamMax ?? null) : null,
      submissionDeadline: deadline,
    }

    if (d.id) {
      await db.update(events).set(values).where(eq(events.id, d.id))
      // Raising the capacity (or removing it) frees seats: let the waitlist in.
      const promoted = await promoteFromWaitlist(d.id)
      await logAdmin({
        actorId: admin.id,
        action: 'event_update',
        entity: 'event',
        entityId: d.id,
        summary: promoted ? `${d.title} (${promoted} moved off the waitlist)` : d.title,
      })
      refresh()
      revalidatePath(`/admin/events/${d.id}`)
      revalidatePath(`/events/${slug}`)
      return { success: 'Saved.' }
    }
    const [row] = await db.insert(events).values(values).returning({ id: events.id })
    await logAdmin({ actorId: admin.id, action: 'event_create', entity: 'event', entityId: row.id, summary: d.title })
    refresh()
    redirect(`/admin/events/${row.id}?created=1`)
  })
}

export async function deleteEvent(id: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const row = await db.query.events.findFirst({ where: eq(events.id, id) })
    await db.delete(events).where(eq(events.id, id))
    await logAdmin({ actorId: admin.id, action: 'event_delete', entity: 'event', entityId: id, summary: row?.title })
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
  return runAdmin(async (admin) => {
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
        await checkAchievements(userId, tx)
      }
    })

    // An admin cancelling someone frees a seat too.
    if (status === 'cancelled') await promoteFromWaitlist(eventId)

    await logAdmin({
      actorId: admin.id,
      action: 'registration_status',
      entity: 'event',
      entityId: eventId,
      summary: `${userId} -> ${status}`,
    })
    revalidatePath('/events')
    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath('/dashboard')
    return { success: 'Updated.' }
  })
}

/** Door check-in: type or scan a ticket code and mark that person as attended. */
export async function checkInByCode(eventId: string, code: string): Promise<ActionState> {
  return runAdmin(async () => {
    const clean = String(code ?? '').trim().toUpperCase()
    if (!/^T-[A-Z0-9]{6}$/.test(clean)) return { error: 'That is not a valid ticket code (looks like T-ABC123).' }
    if (!z.string().uuid().safeParse(eventId).success) return { error: 'Event not found.' }

    const [reg] = await db
      .select({ userId: eventRegistrations.userId, status: eventRegistrations.status, name: profiles.fullName, email: profiles.email })
      .from(eventRegistrations)
      .innerJoin(profiles, eq(eventRegistrations.userId, profiles.id))
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.ticketCode, clean)))
    if (!reg) return { error: 'No ticket with that code for this event.' }
    const who = reg.name || reg.email
    if (reg.status === 'attended') return { error: `${who} is already checked in.` }
    if (reg.status !== 'registered') return { error: `${who} is ${reg.status}, not a confirmed registration.` }

    const res = await setRegistrationStatus(eventId, reg.userId, 'attended')
    return res?.error ? res : { success: `Checked in: ${who}` }
  })
}
