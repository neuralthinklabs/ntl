import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { and, eq, gt, inArray, isNull, lt, sql } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { communities } from '@/db/community-schema'
import { communityMeetings, meetingRsvps } from '@/db/collab-schema'
import { sendEmail, escapeHtml } from '@/lib/email'
import { notify } from '@/lib/community/notify'
import { groupHref } from '@/lib/community/constants'
import { formatEventWhen } from '@/lib/events'

// One reminder (in-app + email) to people who RSVPed going/maybe, for meetings that
// start within 30 hours. Run once a day. Requires CRON_SECRET; fails closed.
export const dynamic = 'force-dynamic'

function sameSecret(given: string, expected: string) {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected || !sameSecret(request.headers.get('authorization') ?? '', `Bearer ${expected}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const canEmail = !!process.env.RESEND_API_KEY
  const now = new Date()
  const until = new Date(now.getTime() + 30 * 60 * 60 * 1000)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  const meetings = await db
    .select({ m: communityMeetings, slug: communities.slug, visibility: communities.visibility, group: communities.name })
    .from(communityMeetings)
    .innerJoin(communities, eq(communityMeetings.communityId, communities.id))
    .where(and(eq(communityMeetings.status, 'scheduled'), isNull(communityMeetings.reminderSentAt), gt(communityMeetings.startsAt, now), lt(communityMeetings.startsAt, until), sql`${communities.archivedAt} is null`))
    .limit(100)

  let reminded = 0
  for (const { m, slug, visibility, group } of meetings) {
    const people = await db
      .select({ userId: meetingRsvps.userId, email: profiles.email })
      .from(meetingRsvps)
      .innerJoin(profiles, eq(meetingRsvps.userId, profiles.id))
      .where(and(eq(meetingRsvps.meetingId, m.id), inArray(meetingRsvps.response, ['going', 'maybe'])))
    const when = formatEventWhen(m)
    const href = `${groupHref({ slug, visibility })}?tab=meetings`
    await notify(people.map((p) => ({ userId: p.userId, type: 'meeting_reminder' as const, title: `Reminder: ${m.title} (${group})`, body: when, link: href })))
    if (canEmail) {
      const place = m.location ? `<p>${escapeHtml(m.location)}</p>` : ''
      const join = m.meetingUrl?.startsWith('https://') ? `<p><a href="${escapeHtml(m.meetingUrl)}">Join the meeting</a></p>` : ''
      for (const p of people) {
        if (!p.email) continue
        await sendEmail({
          to: p.email,
          subject: `Reminder: ${m.title}`.replace(/[\r\n]+/g, ' '),
          html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0d0f12;line-height:1.55"><h2>Your meeting is coming up</h2><p><strong>${escapeHtml(m.title)}</strong> (${escapeHtml(group)})<br/>${escapeHtml(when)}</p>${place}${join}<p><a href="${escapeHtml(`${base}${href}`)}">Meeting details</a></p><p style="color:#555">Neural Think Labs</p></div>`,
        })
      }
    }
    await db.update(communityMeetings).set({ reminderSentAt: new Date() }).where(eq(communityMeetings.id, m.id))
    reminded++
  }
  return NextResponse.json({ ok: true, reminded })
}
