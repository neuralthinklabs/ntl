import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { and, eq, gt, isNull, lt } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventRegistrations, profiles } from '@/db/schema'
import { sendEmail, escapeHtml } from '@/lib/email'
import { formatEventWhen } from '@/lib/events'

// Sends ONE reminder to each registered person whose event starts within the
// next 30 hours. Run once a day (vercel.json / netlify function). Requires
// CRON_SECRET and fails closed without it.
export const dynamic = 'force-dynamic'

function sameSecret(given: string, expected: string) {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  const given = request.headers.get('authorization') ?? ''
  if (!expected || !sameSecret(given, `Bearer ${expected}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Without an email key nothing can be sent, so do not mark anyone as reminded.
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, skipped: 'RESEND_API_KEY not set' })

  const now = new Date()
  const until = new Date(now.getTime() + 30 * 60 * 60 * 1000)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  const rows = await db
    .select({ ev: events, userId: eventRegistrations.userId, email: profiles.email })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .innerJoin(profiles, eq(eventRegistrations.userId, profiles.id))
    .where(
      and(
        eq(eventRegistrations.status, 'registered'),
        isNull(eventRegistrations.reminderSentAt),
        gt(events.startsAt, now),
        lt(events.startsAt, until),
      ),
    )
    .limit(200)

  let sent = 0
  for (const { ev, userId, email } of rows) {
    if (!email) continue
    const where = ev.isOnline ? 'Online' : (ev.location ?? 'Location to be announced')
    const link = ev.isOnline && ev.meetingUrl?.startsWith('https://') ? `<p><a href="${escapeHtml(ev.meetingUrl)}">Join the meeting</a></p>` : ''
    const page = base ? `<p><a href="${escapeHtml(`${base}/events/${ev.slug}`)}">Event details</a></p>` : ''
    await sendEmail({
      to: email,
      subject: `Reminder: ${ev.title}`.replace(/[\r\n]+/g, ' '),
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0d0f12;line-height:1.55"><h2>Your event is coming up</h2><p><strong>${escapeHtml(ev.title)}</strong><br/>${escapeHtml(formatEventWhen(ev))}<br/>${escapeHtml(where)}</p>${link}${page}<p style="color:#555">Neural Think Labs</p></div>`,
    })
    await db
      .update(eventRegistrations)
      .set({ reminderSentAt: new Date() })
      .where(and(eq(eventRegistrations.eventId, ev.id), eq(eventRegistrations.userId, userId)))
    sent++
  }
  return NextResponse.json({ ok: true, sent })
}
