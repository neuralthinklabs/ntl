import Link from 'next/link'
import { desc } from 'drizzle-orm'
import { db } from '@/db'
import { events } from '@/db/schema'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { formatEventWhen } from '@/lib/events'

export const metadata = { title: 'Events' }

export default async function AdminEventsPage() {
  const rows = await db.query.events.findMany({ orderBy: [desc(events.startsAt)], limit: 100 })
  const now = new Date()
  return (
    <>
      <AdminHeader title="Events" description="Create events and manage who is registered." newHref="/admin/events/new" newLabel="New event" />
      <div className="flex flex-col gap-3">
        {rows.map((e) => (
          <Link key={e.id} href={`/admin/events/${e.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{e.title}</p>
              <p className="mt-0.5 text-xs text-slate-600">{formatEventWhen(e)}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-600">{e.startsAt >= now ? 'Upcoming' : 'Past'}</span>
          </Link>
        ))}
        {rows.length === 0 && <EmptyState>No events yet.</EmptyState>}
      </div>
    </>
  )
}
