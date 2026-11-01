import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { desc, eq, ne, and } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { events, eventRegistrations, ticketTypes } from '@/db/schema'
import { eventWhere, formatEventWhen } from '@/lib/events'
import { providerLabel } from '@/lib/event-constants'

export const metadata: Metadata = { title: 'My tickets', robots: { index: false } }
export const dynamic = 'force-dynamic'

const LABEL: Record<string, string> = { registered: 'Confirmed', waitlisted: 'On waitlist', attended: 'Attended' }

export default async function MyTicketsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/tickets')

  const rows = await db
    .select({ ev: events, status: eventRegistrations.status, code: eventRegistrations.ticketCode, ticket: ticketTypes.name })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .leftJoin(ticketTypes, eq(eventRegistrations.ticketTypeId, ticketTypes.id))
    .where(and(eq(eventRegistrations.userId, user.id), ne(eventRegistrations.status, 'cancelled')))
    .orderBy(desc(events.startsAt))
    .limit(50)
  const now = new Date()

  return (
    <SiteShell>
      <PageHero title="My tickets" description="Your event registrations and ticket codes." />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No tickets yet. <Link href="/events" className="font-medium text-brand-muted underline">Browse events</Link>.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {rows.map(({ ev, status, code, ticket }) => {
              const upcoming = ev.startsAt >= now
              const showLink = upcoming && status === 'registered' && !!ev.meetingUrl?.startsWith('https://')
              return (
                <li key={ev.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-ink"><Link href={`/events/${ev.slug}`} className="hover:underline">{ev.title}</Link></h2>
                      <p className="mt-0.5 text-xs text-slate-600">{formatEventWhen(ev)} · {eventWhere(ev)}</p>
                    </div>
                    <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-muted">{LABEL[status] ?? status}</span>
                  </div>
                  {status !== 'waitlisted' && (
                    <p className="mt-3 text-sm text-slate-700">
                      {ticket ? `${ticket} · ` : ''}Code <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-semibold text-ink">{code}</span>
                    </p>
                  )}
                  {showLink && (
                    <p className="mt-2 text-sm"><a href={ev.meetingUrl!} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-muted underline">Join on {providerLabel(ev.meetingUrl)}</a></p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </SiteShell>
  )
}
