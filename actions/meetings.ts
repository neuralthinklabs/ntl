'use server'

import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { communityMembers } from '@/db/community-schema'
import { communityMeetings, meetingRsvps } from '@/db/collab-schema'
import { guard } from '@/lib/community/authz'
import { notify } from '@/lib/community/notify'
import { groupHref } from '@/lib/community/constants'
import { RSVP_RESPONSES } from '@/lib/collab/constants'
import { throttle } from '@/lib/collab/throttle'
import { formatEventWhen } from '@/lib/events'
import { isValidTimeZone, zonedLocalToDate } from '@/lib/tz'
import type { ActionState } from './auth'

const uuid = z.string().uuid()
const httpsUrl = z.string().trim().max(500).url('Enter a valid meeting link.').refine((u) => u.startsWith('https://'), 'The meeting link must start with https://')

const scheduleSchema = z.object({
  communityId: uuid,
  title: z.string().trim().min(3, 'Give the meeting a title (3+ characters).').max(200),
  description: z.string().trim().max(3000).optional(),
  agenda: z.string().trim().max(3000).optional(),
  location: z.string().trim().max(200).optional(),
  meetingUrl: httpsUrl.optional(),
  timezone: z.string().trim().min(1),
  startsAt: z.string().min(1, 'Choose a start date and time.'),
  endsAt: z.string().optional(),
})

function refresh(c: { slug: string; visibility: string }) {
  revalidatePath(groupHref(c))
}

export async function scheduleMeeting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = (k: string) => (formData.get(k) as string) || undefined
  const parsed = scheduleSchema.safeParse({
    communityId: formData.get('communityId'), title: formData.get('title'), description: f('description'), agenda: f('agenda'),
    location: f('location'), meetingUrl: f('meetingUrl'), timezone: formData.get('timezone'), startsAt: formData.get('startsAt'), endsAt: f('endsAt'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const d = parsed.data

  const g = await guard(d.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  if (g.community.archivedAt) return { error: 'This group is archived.' }
  const limited = await throttle(`meeting:create:${g.viewer.id}`, 15)
  if (limited) return limited

  if (!isValidTimeZone(d.timezone)) return { error: 'Enter a valid time zone, e.g. Asia/Kolkata or UTC.' }
  const startsAt = zonedLocalToDate(d.startsAt, d.timezone)
  if (!startsAt) return { error: 'The start date and time are not valid.' }
  if (startsAt.getTime() < Date.now() - 5 * 60_000) return { error: 'A meeting cannot start in the past.' }
  const endsAt = d.endsAt ? zonedLocalToDate(d.endsAt, d.timezone) : null
  if (d.endsAt && !endsAt) return { error: 'The end date and time are not valid.' }
  if (endsAt && endsAt <= startsAt) return { error: 'The end must be after the start.' }
  if (!d.meetingUrl && !d.location) return { error: 'Add a meeting link, a place, or both.' }

  const [m] = await db
    .insert(communityMeetings)
    .values({
      communityId: g.community.id, createdBy: g.viewer.id, title: d.title, description: d.description ?? null, agenda: d.agenda ?? null,
      location: d.location ?? null, meetingUrl: d.meetingUrl ?? null, timezone: d.timezone, startsAt, endsAt,
    })
    .returning({ id: communityMeetings.id })

  const members = await db
    .select({ userId: communityMembers.userId })
    .from(communityMembers)
    .where(and(eq(communityMembers.communityId, g.community.id), eq(communityMembers.status, 'active')))
  const when = formatEventWhen({ startsAt, endsAt, timezone: d.timezone })
  await notify(
    members.map((x) => ({ userId: x.userId, type: 'meeting_scheduled' as const, title: `Meeting in ${g.community.name}: ${d.title}`, body: when, link: `${groupHref(g.community)}?tab=meetings`, actorId: g.viewer.id })),
  )
  void m
  refresh(g.community)
  return { success: 'Meeting scheduled. Members were notified.' }
}

export async function setRsvp(meetingId: string, response: string): Promise<ActionState> {
  const p = z.object({ meetingId: uuid, response: z.enum(RSVP_RESPONSES) }).safeParse({ meetingId, response })
  if (!p.success) return { error: 'Invalid response.' }
  const [m] = await db.select().from(communityMeetings).where(eq(communityMeetings.id, p.data.meetingId)).limit(1)
  if (!m || m.status !== 'scheduled') return { error: 'This meeting is not available.' }
  const g = await guard(m.communityId, 'interact')
  if (!g.ok) return { error: g.error }
  if ((m.endsAt ?? new Date(m.startsAt.getTime() + 3_600_000)) < new Date()) return { error: 'This meeting has already ended.' }
  await db
    .insert(meetingRsvps)
    .values({ meetingId: m.id, userId: g.viewer.id, response: p.data.response })
    .onConflictDoUpdate({ target: [meetingRsvps.meetingId, meetingRsvps.userId], set: { response: p.data.response, updatedAt: new Date() } })
  refresh(g.community)
  return { success: 'Saved.' }
}

export async function cancelMeeting(meetingId: string, reason: string): Promise<ActionState> {
  if (!uuid.safeParse(meetingId).success) return { error: 'Meeting not found.' }
  const [m] = await db.select().from(communityMeetings).where(eq(communityMeetings.id, meetingId)).limit(1)
  if (!m) return { error: 'Meeting not found.' }
  const g = await guard(m.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  const why = z.string().trim().max(500).parse(reason ?? '')
  const updated = await db
    .update(communityMeetings)
    .set({ status: 'cancelled', cancelReason: why || null, updatedAt: new Date() })
    .where(and(eq(communityMeetings.id, m.id), eq(communityMeetings.status, 'scheduled')))
    .returning({ id: communityMeetings.id })
  if (!updated.length) return { error: 'This meeting was already cancelled.' }
  const rsvps = await db
    .select({ userId: meetingRsvps.userId })
    .from(meetingRsvps)
    .where(and(eq(meetingRsvps.meetingId, m.id), inArray(meetingRsvps.response, ['going', 'maybe'])))
  await notify(
    rsvps.map((x) => ({ userId: x.userId, type: 'meeting_cancelled' as const, title: `Meeting cancelled: ${m.title}`, body: why || undefined, link: `${groupHref(g.community)}?tab=meetings`, actorId: g.viewer.id })),
  )
  refresh(g.community)
  return { success: 'Meeting cancelled.' }
}

export async function saveMinutes(meetingId: string, minutes: string): Promise<ActionState> {
  if (!uuid.safeParse(meetingId).success) return { error: 'Meeting not found.' }
  const text = z.string().trim().max(20000, 'Minutes can be up to 20,000 characters.').safeParse(minutes ?? '')
  if (!text.success) return { error: text.error.issues[0]?.message ?? 'Invalid minutes.' }
  const [m] = await db.select().from(communityMeetings).where(eq(communityMeetings.id, meetingId)).limit(1)
  if (!m) return { error: 'Meeting not found.' }
  const g = await guard(m.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  await db.update(communityMeetings).set({ minutes: text.data || null, updatedAt: new Date() }).where(eq(communityMeetings.id, m.id))
  refresh(g.community)
  return { success: 'Minutes saved.' }
}
