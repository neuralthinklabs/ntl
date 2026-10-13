import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { problems } from '@/db/schema'
import { Pager } from '@/components/site/pager'
import { AdminProblemRow } from '@/components/admin/admin-problem-row'
import { AdminHeader, EmptyState, FilterPills } from '@/components/admin/admin-header'
import { parsePage, totalPages } from '@/lib/pagination'
import { createClient } from '@/lib/supabase/server'
import { goals as ntldgs, goalIndexBySlug } from '@/lib/ntldgs'

export const metadata = { title: 'Problems' }

const STATUSES = ['submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'declined'] as const

export default async function AdminProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const sp = await searchParams
  const { page, limit, offset } = parsePage(sp)
  const status = STATUSES.find((s) => s === sp.status)
  const where = status ? eq(problems.status, status) : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.problems.findMany({
      where,
      orderBy: [desc(problems.createdAt)],
      with: { submitter: true, attachments: true },
      limit,
      offset,
    }),
    db.select({ value: count() }).from(problems).where(and(where)),
  ])

  // Signed links so admins can open private attachments (valid for 1 hour).
  const supabase = await createClient()
  const withUrls = await Promise.all(
    rows.map(async (p) => ({
      p,
      files: await Promise.all(
        p.attachments.map(async (a) => {
          const { data } = await supabase.storage.from('problem-attachments').createSignedUrl(a.storagePath, 3600)
          return { name: a.fileName, url: data?.signedUrl ?? null }
        }),
      ),
    })),
  )

  return (
    <>
      <AdminHeader title="Problems" description="Review submissions. Changing a status emails the person who submitted it." />
      <FilterPills
        basePath="/admin/problems"
        current={status ?? 'all'}
        options={[{ value: 'all', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))]}
      />
      <div className="flex flex-col gap-4">
        {withUrls.map(({ p, files }) => {
          const gi = goalIndexBySlug(p.ntldgSlug)
          return (
            <AdminProblemRow
              key={p.id}
              id={p.id}
              title={p.title}
              description={p.description}
              status={p.status}
              submitterEmail={p.submitter?.email ?? 'unknown'}
              submittedAt={new Date(p.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
              adminNotes={p.adminNotes ?? ''}
              category={p.category}
              location={p.location}
              goalLabel={gi >= 0 ? `${ntldgs[gi].verb}: ${ntldgs[gi].title}` : undefined}
              attachments={files}
            />
          )
        })}
        {rows.length === 0 && <EmptyState>No problems match this filter.</EmptyState>}
      </div>
      <Pager page={page} totalPages={totalPages(total, limit)} basePath="/admin/problems" />
    </>
  )
}
