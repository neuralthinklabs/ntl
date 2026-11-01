import { getEventBySlug } from '@/lib/event-page'
import { eventWhere } from '@/lib/events'
import { buildIcs } from '@/lib/ics'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ev = await getEventBySlug(slug)
  if (!ev) return new Response('Not found', { status: 404 })

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const place = [eventWhere(ev), ev.venueAddress].filter(Boolean).join(', ')
  const body = buildIcs({
    uid: ev.id,
    title: ev.title,
    description: ev.description,
    location: place,
    url: base ? `${base}/events/${ev.slug}` : undefined,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
  })
  // The private meeting link is deliberately NOT in this public file.
  return new Response(body, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="${ev.slug}.ics"` },
  })
}
