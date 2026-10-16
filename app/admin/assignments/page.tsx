import Link from 'next/link'
import { count, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { assignments, profiles } from '@/db/schema'
import { Pager } from '@/components/site/pager'
import { AssignmentRow } from '@/components/admin/assignment-row'
import { AdminHeader, EmptyState, FilterPills } from '@/components/admin/admin-header'
import { parsePage, totalPages } from '@/lib/pagination'
import { formatDate } from '@/lib/datetime'

export const metadata = { title: 'Assignments' }

const STATUSES = ['assigned', 'in_progress', 'submitted', 'done', 'cancelled'] as const

export default async function AdminAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const sp = await searchParams
  const { page, limit, offset } = parsePage(sp)
  const status = STATUSES.find((s) => s === sp.status)
  const where = status ? eq(assignments.status, status) : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({ a: assignments, name: profiles.fullName, email: profiles.email })
      .from(assignments)
      .innerJoin(profiles, eq(assignments.assigneeId, profiles.id))
      .where(where)
      .orderBy(desc(assignments.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(assignments).where(where),
  ])

  return (
    <>
      <AdminHeader
        title="Assignments"
        description="Work you have handed to volunteers and the core team. They only see their own."
        newHref="/admin/assignments/problems"
        newLabel="Assign problems"
      />
      <p className="mb-5 text-sm">
        <Link href="/admin/assignments/blog" className="font-medium text-brand-muted underline">Assign a blog post</Link>
      </p>
      <FilterPills
        basePath="/admin/assignments"
        current={status ?? 'all'}
        options={[{ value: 'all', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))]}
      />
      <div className="flex flex-col gap-4">
        {rows.map(({ a, name, email }) => (
          <AssignmentRow
            key={a.id}
            id={a.id}
            kind={a.kind}
            title={a.title}
            assignee={name || email}
            status={a.status}
            note={a.assigneeNote}
            due={a.dueDate ? formatDate(a.dueDate) : null}
            postId={a.kind === 'blog_post' ? a.storyId : null}
          />
        ))}
        {rows.length === 0 && <EmptyState>No assignments yet.</EmptyState>}
      </div>
      <Pager page={page} totalPages={totalPages(total, limit)} basePath={status ? `/admin/assignments?status=${status}` : '/admin/assignments'} />
    </>
  )
}
