import Link from 'next/link'
import { count, desc, eq, gte, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { problems, contactEnquiries, contributions, events, stories, volunteerApplications } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'

export const metadata = { title: 'Overview' }

export default async function AdminOverview() {
  const [[newProblems], [openContact], [pledges], [upcoming], [drafts], [newVolunteers]] = await Promise.all([
    db.select({ n: count() }).from(problems).where(eq(problems.status, 'submitted')),
    db.select({ n: count() }).from(contactEnquiries).where(eq(contactEnquiries.handled, false)),
    db.select({ n: count() }).from(contributions).where(eq(contributions.status, 'pledged')),
    db.select({ n: count() }).from(events).where(gte(events.startsAt, new Date())),
    db.select({ n: count() }).from(stories).where(isNull(stories.publishedAt)),
    db.select({ n: count() }).from(volunteerApplications).where(eq(volunteerApplications.status, 'new')),
  ])
  const recent = await db.query.problems.findMany({ orderBy: [desc(problems.createdAt)], limit: 5 })

  const cards = [
    { label: 'New problems to review', value: newProblems.n, href: '/admin/problems?status=submitted' },
    { label: 'Pledges awaiting payment', value: pledges.n, href: '/admin/contributions?status=pledged' },
    { label: 'Unhandled messages', value: openContact.n, href: '/admin/contact' },
    { label: 'Upcoming events', value: upcoming.n, href: '/admin/events' },
    { label: 'Draft posts', value: drafts.n, href: '/admin/posts' },
    { label: 'New volunteer applications', value: newVolunteers.n, href: '/admin/volunteers?status=new' },
  ]

  return (
    <>
      <AdminHeader title="Overview" description="What needs your attention right now." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-3xl font-semibold text-ink">{c.value}</p>
            <p className="mt-1 text-sm text-slate-600">{c.label}</p>
          </Link>
        ))}
      </div>
      <h2 className="mt-10 text-base font-semibold text-ink">Latest problems</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {recent.length === 0 && <li className="text-sm text-slate-600">No problems submitted yet.</li>}
        {recent.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <span className="truncate text-ink">{p.title}</span>
            <span className="shrink-0 text-xs capitalize text-slate-600">{p.status.replace('_', ' ')}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
