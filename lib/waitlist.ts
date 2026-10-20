import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventRegistrations, profiles } from '@/db/schema'
import { awardPoints } from '@/lib/points'
import { sendEmail, eventRegistrationEmail } from '@/lib/email'
import { formatEventWhen } from '@/lib/events'

/**
 * Fills any free seats from the waitlist, oldest first, and emails the people
 * who got in. Call it after anything that frees a seat. Returns how many were
 * promoted. Safe to call when nothing changed (it just returns 0).
 */
export async function promoteFromWaitlist(eventId: string): Promise<number> {
  const result = await db.transaction(async (tx) => {
    // Same lock registerForEvent takes, so a new sign-up cannot race this.
    await tx.execute(sql`select id from events where id = ${eventId} for update`)

    const [event] = await tx.select().from(events).where(eq(events.id, eventId))
    if (!event || event.startsAt < new Date()) return null

    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          sql`${eventRegistrations.status} in ('registered','attended')`,
        ),
      )

    const free = event.capacity ? event.capacity - n : 50
    if (free <= 0) return null

    const next = await tx
      .select({ userId: eventRegistrations.userId })
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.status, 'waitlisted')))
      .orderBy(asc(eventRegistrations.registeredAt))
      .limit(Math.min(free, 50))
    if (!next.length) return null

    const ids = next.map((r) => r.userId)
    await tx
      .update(eventRegistrations)
      .set({ status: 'registered' })
      .where(and(eq(eventRegistrations.eventId, eventId), inArray(eventRegistrations.userId, ids)))

    for (const userId of ids) {
      await awardPoints({
        executor: tx,
        userId,
        points: 0,
        type: 'event_registered',
        title: `Registered: ${event.title}`,
        meta: 'Moved off the waitlist',
        relatedId: event.id,
      })
    }
    return { event, ids }
  })

  if (!result) return 0

  const people = await db.select({ email: profiles.email }).from(profiles).where(inArray(profiles.id, result.ids))
  const where = result.event.isOnline ? 'Online' : (result.event.location ?? 'Location to be announced')
  for (const p of people) {
    if (!p.email) continue
    await sendEmail({
      to: p.email,
      subject: `A place opened up: ${result.event.title}`,
      html: eventRegistrationEmail(result.event.title, formatEventWhen(result.event), where, false),
    })
  }
  return result.ids.length
}
