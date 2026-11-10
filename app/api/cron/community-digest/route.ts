import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { and, desc, eq, gt, isNull, ne } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { notifications } from '@/db/community-schema'
import { communityEmailPrefs } from '@/db/collab-schema'
import { sendEmail, escapeHtml } from '@/lib/email'

// Sends the opt-in email digest of UNREAD notifications. Run once a day
// (vercel.json / netlify function). Requires CRON_SECRET and fails closed without it.
export const dynamic = 'force-dynamic'

const DAILY_MS = 20 * 60 * 60 * 1000
const WEEKLY_MS = 6.5 * 24 * 60 * 60 * 1000

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
  // Without an email key nothing can be sent, so do not move anyone's clock.
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, skipped: 'RESEND_API_KEY not set' })

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const prefs = await db
    .select({ userId: communityEmailPrefs.userId, digest: communityEmailPrefs.digest, last: communityEmailPrefs.lastDigestAt, email: profiles.email })
    .from(communityEmailPrefs)
    .innerJoin(profiles, eq(communityEmailPrefs.userId, profiles.id))
    .where(ne(communityEmailPrefs.digest, 'off'))
    .limit(300)

  const now = Date.now()
  const due = prefs.filter((p) => now - p.last.getTime() >= (p.digest === 'daily' ? DAILY_MS : WEEKLY_MS)).slice(0, 100)

  let sent = 0
  for (const p of due) {
    const items = await db
      .select({ title: notifications.title })
      .from(notifications)
      .where(and(eq(notifications.userId, p.userId), isNull(notifications.readAt), gt(notifications.createdAt, p.last)))
      .orderBy(desc(notifications.createdAt))
      .limit(15)
    await db.update(communityEmailPrefs).set({ lastDigestAt: new Date() }).where(eq(communityEmailPrefs.userId, p.userId))
    if (!items.length || !p.email) continue
    const list = items.map((i) => `<li>${escapeHtml(i.title)}</li>`).join('')
    await sendEmail({
      to: p.email,
      subject: `You have ${items.length === 15 ? '15+' : items.length} unread community update${items.length === 1 ? '' : 's'}`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0d0f12;line-height:1.55"><h2>Your NTL community digest</h2><ul>${list}</ul><p><a href="${escapeHtml(`${base}/community/notifications`)}">Open your notifications</a></p><p style="color:#555;font-size:12px">You get this because you turned on email digests. <a href="${escapeHtml(`${base}/community/settings`)}">Change or turn off</a>. Neural Think Labs</p></div>`,
    })
    sent++
  }
  return NextResponse.json({ ok: true, checked: due.length, sent })
}
