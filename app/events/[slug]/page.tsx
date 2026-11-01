import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarPlus, Clock, MapPin, Ticket, Users, Video } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { RegisterButton } from '@/components/events/register-button'
import { HackathonPanel } from '@/components/events/hackathon-panel'
import { createClient } from '@/lib/supabase/server'
import { eventWhere, formatEventWhen } from '@/lib/events'
import { getEventBySlug, getMyRegistration, getTakenCount, getTickets } from '@/lib/event-page'
import { getMyTeam } from '@/lib/hackathon'
import { KIND_LABEL, providerLabel } from '@/lib/event-constants'
import { btnSecondary } from '@/lib/ui'

type Props = { params: Promise<{ slug: string }> }
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const e = await getEventBySlug(slug)
  if (!e) return { title: 'Event not found' }
  return { title: e.title, description: e.description?.slice(0, 160) || undefined, alternates: { canonical: `/events/${e.slug}` } }
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const ev = await getEventBySlug(slug)
  if (!ev) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [taken, tickets, mine] = await Promise.all([
    getTakenCount(ev.id),
    getTickets(ev.id),
    user ? getMyRegistration(ev.id, user.id) : Promise.resolve(undefined),
  ])

  const now = new Date()
  const started = ev.startsAt < now
  const closed = started || (!!ev.registrationClosesAt && ev.registrationClosesAt < now)
  const full = !!ev.capacity && taken >= ev.capacity
  const left = ev.capacity ? Math.max(0, ev.capacity - taken) : null
  const isIn = mine?.status === 'registered' || mine?.status === 'attended'
  const showLink = isIn && !!ev.meetingUrl && ev.meetingUrl.startsWith('https://')
  const hack = ev.kind === 'hackathon'
  const team = hack && user && isIn ? await getMyTeam(ev.id, user.id) : null
  const locked = !!ev.submissionDeadline && ev.submissionDeadline < now
  const when = (d: Date) => formatEventWhen({ startsAt: d, endsAt: null, timezone: ev.timezone })

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:underline">
          <ArrowLeft className="size-4" /> All events
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">{KIND_LABEL[ev.kind] ?? 'Event'}</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{ev.title}</h1>

        <ul className="mt-6 flex flex-col gap-2.5 text-sm text-slate-700">
          <li className="flex items-start gap-2.5"><Clock className="mt-0.5 size-4 shrink-0 text-slate-500" />{formatEventWhen(ev)}</li>
          <li className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" />
            <span>
              {eventWhere(ev)}
              {ev.venueAddress && <span className="block text-slate-600">{ev.venueAddress}</span>}
              {ev.venueMapUrl && ev.venueMapUrl.startsWith('https://') && (
                <a href={ev.venueMapUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-muted underline">Open in maps</a>
              )}
            </span>
          </li>
          {ev.isOnline && (
            <li className="flex items-start gap-2.5">
              <Video className="mt-0.5 size-4 shrink-0 text-slate-500" />
              {ev.meetingUrl ? `Joins via ${providerLabel(ev.meetingUrl)}. The link appears here once you have a ticket.` : 'The meeting link will be shared with ticket holders.'}
            </li>
          )}
          {left !== null && !closed && (
            <li className="flex items-start gap-2.5">
              <Users className="mt-0.5 size-4 shrink-0 text-slate-500" />
              {full ? 'Event is full. You can join the waitlist.' : `${left} of ${ev.capacity} places left`}
            </li>
          )}
          {ev.registrationClosesAt && !started && (
            <li className="flex items-start gap-2.5"><Ticket className="mt-0.5 size-4 shrink-0 text-slate-500" />Registration {closed ? 'closed' : 'closes'} {when(ev.registrationClosesAt)}</li>
          )}
        </ul>

        {closed && !mine && <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">{started ? 'This event has already started or ended' : 'Registration for this event has closed'}.</p>}

        <div className="mt-8 flex flex-wrap items-start gap-3">
          <RegisterButton eventId={ev.id} status={mine?.status} isLoggedIn={!!user} full={full} closed={closed} nextPath={`/events/${ev.slug}`} tickets={tickets} />
          <a href={`/events/${ev.slug}/calendar`} className={btnSecondary}>
            <CalendarPlus className="size-4" /> Add to calendar
          </a>
        </div>

        {mine && mine.status !== 'waitlisted' && (
          <div className="mt-6 rounded-2xl border border-brand/30 bg-brand-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Your ticket{mine.ticketName ? ` · ${mine.ticketName}` : ''}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-ink">{mine.code}</p>
            <p className="mt-1 text-xs text-slate-700">Show this code at check-in.</p>
            {showLink && (
              <p className="mt-3 text-sm">
                <a href={ev.meetingUrl!} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-muted underline">Join on {providerLabel(ev.meetingUrl)}</a>
              </p>
            )}
          </div>
        )}

        {ev.description && <p className="mt-10 whitespace-pre-wrap text-base leading-relaxed text-slate-700">{ev.description}</p>}

        {hack && (
          <>
            {ev.submissionDeadline && <p className="mt-6 text-sm font-medium text-ink">Submission deadline: {when(ev.submissionDeadline)}</p>}
            {isIn && user ? (
              <HackathonPanel eventId={ev.id} team={team} locked={locked} teamMin={ev.teamMin} teamMax={ev.teamMax} />
            ) : (
              <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">Get a ticket to create or join a team and submit your project.</p>
            )}
          </>
        )}
      </article>
    </SiteShell>
  )
}
