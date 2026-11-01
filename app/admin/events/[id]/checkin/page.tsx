import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, count, eq } from 'drizzle-orm'
import { db } from '@/db'
import { events, eventRegistrations } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { CheckInForm } from '@/components/admin/checkin-form'

export const metadata = { title: 'Check-in' }
export const dynamic = 'force-dynamic'

export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const ev = await db.query.events.findFirst({ where: eq(events.id, id) })
  if (!ev) notFound()
  const [[attended], [going]] = await Promise.all([
    db.select({ n: count() }).from(eventRegistrations).where(and(eq(eventRegistrations.eventId, id), eq(eventRegistrations.status, 'attended'))),
    db.select({ n: count() }).from(eventRegistrations).where(and(eq(eventRegistrations.eventId, id), eq(eventRegistrations.status, 'registered'))),
  ])
  return (
    <>
      <AdminHeader title={`Check-in: ${ev.title}`} description="Type or scan the code on a person's ticket (My tickets page or confirmation email). They are marked as attended and earn their points." />
      <p className="mb-6 text-sm text-slate-700">{attended.n} checked in · {going.n} still to arrive</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CheckInForm eventId={id} />
      </div>
      <p className="mt-6 text-sm"><Link href={`/admin/events/${id}`} className="font-medium text-brand-muted underline">Back to the event</Link></p>
    </>
  )
}
