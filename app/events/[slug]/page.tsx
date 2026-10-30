import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarPlus, Clock, MapPin, Users, Video } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { RegisterButton } from '@/components/events/register-button'
import { createClient } from '@/lib/supabase/server'
import { formatEventWhen } from '@/lib/events'
import { getEventBySlug, getMyStatus, getTakenCount } from '@/lib/event-page'
import { btnSecondary } from '@/lib/ui'

type Props = { params: Promise<{ slug: string }> }
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const e = await getEventBySlug(slug)
  if (!e) return { title: 'Event not found' }
  return {
    title: e.title,
    description: e.description?.slice(0, 160) || undefined,
    alternates: { canonical: `/events/${e.slug}` },
  }
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const ev = await getEventBySlug(slug)
  if (!ev) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [taken, mine] = await Promise.all([getTakenCount(ev.id), user ? getMyStatus(ev.id, user.id) : Promise.resolve(undefined)])

  const past = ev.startsAt < new Date()
  const full = !!ev.capacity && taken >= ev.capacity
  const left = ev.capacity ? Math.max(0, ev.capacity - taken) : null
  const where = ev.isOnline ? 'Online' : ev.location || 'Location to be announced'
  // The meeting link is only for people who are in.
  const showLink = !!ev.meetingUrl && ev.meetingUrl.startsWith('https://') && (mine === 'registered' || mine === 'attended')

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:underline">
          <ArrowLeft className="size-4" /> All events
        </Link>
        <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{ev.title}</h1>

        <ul className="mt-6 flex flex-col gap-2.5 text-sm text-slate-700">
          <li className="flex items-start gap-2.5"><Clock className="mt-0.5 size-4 shrink-0 text-slate-500" />{formatEventWhen(ev)}</li>
          <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" />{where}</li>
          {left !== null && !past && (
            <li className="flex items-start gap-2.5">
              <Users className="mt-0.5 size-4 shrink-0 text-slate-500" />
              {full ? 'Event is full. You can join the waitlist.' : `${left} of ${ev.capacity} places left`}
            </li>
          )}
        </ul>

        {past && <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">This event has already started or ended, so registration is closed.</p>}

        <div className="mt-8 flex flex-wrap items-start gap-3">
          <RegisterButton eventId={ev.id} status={mine} isLoggedIn={!!user} full={full} past={past} nextPath={`/events/${ev.slug}`} />
          <a href={`/events/${ev.slug}/calendar`} className={btnSecondary}>
            <CalendarPlus className="size-4" /> Add to calendar
          </a>
        </div>

        {showLink && (
          <p className="mt-6 flex items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-ink">
            <Video className="size-4 shrink-0 text-brand-muted" />
            <a href={ev.meetingUrl!} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-muted underline">Join the meeting</a>
          </p>
        )}

        {ev.description && <p className="mt-10 whitespace-pre-wrap text-base leading-relaxed text-slate-700">{ev.description}</p>}
      </article>
    </SiteShell>
  )
}
