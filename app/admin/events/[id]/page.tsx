import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventRegistrations } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { EventForm } from '@/components/admin/event-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { RegistrationRow } from '@/components/admin/registration-row'
import { deleteEvent } from '@/actions/admin/events'
import { dateToZonedLocal } from '@/lib/tz'

export const metadata = { title: 'Edit event' }

export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params
  const { created } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const ev = await db.query.events.findFirst({ where: eq(events.id, id) })
  if (!ev) notFound()
  const regs = await db.query.eventRegistrations.findMany({
    where: eq(eventRegistrations.eventId, id),
    with: { user: true },
    orderBy: [asc(eventRegistrations.registeredAt)],
  })

  return (
    <>
      <AdminHeader title="Edit event" />
      {created && <p role="status" className="mb-4 rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">Event created.</p>}
      <EventForm
        initial={{
          id: ev.id,
          title: ev.title,
          slug: ev.slug,
          description: ev.description ?? '',
          location: ev.location ?? '',
          isOnline: ev.isOnline,
          timezone: ev.timezone,
          startsAt: dateToZonedLocal(ev.startsAt, ev.timezone),
          endsAt: ev.endsAt ? dateToZonedLocal(ev.endsAt, ev.timezone) : '',
          capacity: ev.capacity ? String(ev.capacity) : '',
        }}
      />

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Registrations ({regs.length})</h2>
        <p className="mt-1 text-xs text-slate-600">Marking someone “attended” awards them points once.</p>
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
