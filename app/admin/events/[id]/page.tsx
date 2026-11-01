import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventRegistrations, ticketTypes } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { EventForm } from '@/components/admin/event-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { RegistrationRow } from '@/components/admin/registration-row'
import { TicketEditor } from '@/components/admin/ticket-editor'
import { deleteEvent } from '@/actions/admin/events'
import { dateToZonedLocal } from '@/lib/tz'
import { formatEventWhen } from '@/lib/events'
import { formatOf } from '@/lib/event-constants'

export const metadata = { title: 'Edit event' }

export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params
  const { created } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const ev = await db.query.events.findFirst({ where: eq(events.id, id) })
  if (!ev) notFound()

  const [regs, tickets] = await Promise.all([
    db.query.eventRegistrations.findMany({
      where: eq(eventRegistrations.eventId, id),
      with: { user: true },
      orderBy: [asc(eventRegistrations.registeredAt)],
    }),
    db
      .select({
        t: ticketTypes,
        sold: sql<number>`count(${eventRegistrations.userId}) filter (where ${eventRegistrations.status} in ('registered','attended'))::int`,
      })
      .from(ticketTypes)
      .leftJoin(eventRegistrations, eq(eventRegistrations.ticketTypeId, ticketTypes.id))
      .where(eq(ticketTypes.eventId, id))
      .groupBy(ticketTypes.id)
      .orderBy(asc(ticketTypes.sortOrder)),
  ])
  const z = (d: Date | null) => (d ? dateToZonedLocal(d, ev.timezone) : '')
  const win = (a: Date | null, b: Date | null) =>
    [a ? `opens ${formatEventWhen({ startsAt: a, endsAt: null, timezone: ev.timezone })}` : '', b ? `closes ${formatEventWhen({ startsAt: b, endsAt: null, timezone: ev.timezone })}` : ''].filter(Boolean).join(', ')

  return (
    <>
      <AdminHeader title="Edit event" />
      {created && <p role="status" className="mb-4 rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">Event created. Add tickets below if you want people to choose one.</p>}
      <div className="mb-5 flex flex-wrap gap-4 text-sm font-medium">
        <Link href={`/events/${ev.slug}`} target="_blank" className="text-brand-muted underline">View public page</Link>
        <Link href={`/admin/events/${ev.id}/checkin`} className="text-brand-muted underline">Door check-in</Link>
        {ev.kind === 'hackathon' && <Link href={`/admin/events/${ev.id}/teams`} className="text-brand-muted underline">Teams and submissions</Link>}
      </div>
      <EventForm
        initial={{
          id: ev.id,
          title: ev.title,
          slug: ev.slug,
          kind: ev.kind,
          description: ev.description ?? '',
          format: formatOf(ev),
          location: ev.location ?? '',
          venueAddress: ev.venueAddress ?? '',
          venueMapUrl: ev.venueMapUrl ?? '',
          meetingUrl: ev.meetingUrl ?? '',
          timezone: ev.timezone,
          startsAt: z(ev.startsAt),
          endsAt: z(ev.endsAt),
          registrationClosesAt: z(ev.registrationClosesAt),
          capacity: ev.capacity ? String(ev.capacity) : '',
          teamMin: ev.teamMin ? String(ev.teamMin) : '',
          teamMax: ev.teamMax ? String(ev.teamMax) : '',
          submissionDeadline: z(ev.submissionDeadline),
        }}
      />

      <div className="mt-8">
        <TicketEditor
          eventId={ev.id}
          timezone={ev.timezone}
          tickets={tickets.map(({ t, sold }) => ({ id: t.id, name: t.name, description: t.description ?? '', quantity: t.quantity, sold, window: win(t.salesStart, t.salesEnd) }))}
        />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Registrations ({regs.length})</h2>
        <p className="mt-1 text-xs text-slate-600">Marking someone “attended” awards them points once.</p>
        <a href={`/admin/events/${ev.id}/export`} className="mt-2 inline-block text-xs font-medium text-brand-muted underline">Download list (CSV)</a>
        {regs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No one has registered yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <thead className="text-xs text-slate-600">
                <tr><th className="pb-2 pr-4 font-medium">Name</th><th className="pb-2 pr-4 font-medium">Email</th><th className="pb-2 font-medium">Status</th></tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <RegistrationRow key={r.userId} eventId={ev.id} userId={r.userId} name={r.user?.fullName ?? '—'} email={r.user?.email ?? ''} status={r.status} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="mt-6">
        <DeleteButton action={deleteEvent.bind(null, ev.id)} what={`“${ev.title}” and its registrations`} label="Delete event" />
      </div>
    </>
  )
}
