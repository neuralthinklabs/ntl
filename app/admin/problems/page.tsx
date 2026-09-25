import type { Metadata } from 'next'
import { desc, count } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { Pager } from '@/components/site/pager'
import { db } from '@/db'
import { problems } from '@/db/schema'
import { AdminProblemRow } from '@/components/admin/admin-problem-row'
import { requireAdminPage } from '@/lib/auth/admin'
import { parsePage, totalPages } from '@/lib/pagination'

export const metadata: Metadata = {
  title: 'Review Problems — Admin',
}

export default async function AdminProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireAdminPage('/admin/problems')

  const { page, limit, offset } = parsePage(await searchParams)

  // P1 #11: this list has no natural upper bound (every submission ever
  // made) — paginate it instead of `findMany()` with no limit, which used
  // to load and render the entire table on every visit.
  const [all, [{ value: totalCount }]] = await Promise.all([
    db.query.problems.findMany({
      orderBy: [desc(problems.createdAt)],
      with: { submitter: true },
      limit,
      offset,
    }),
    db.select({ value: count() }).from(problems),
  ])

  return (
    <SiteShell>
      <PageHero title="Review Problems" description="Approve, decline, or update the status of submitted problems." />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4">
          {all.map((p) => (
            <AdminProblemRow
              key={p.id}
              id={p.id}
              title={p.title}
              description={p.description}
              status={p.status}
              submitterEmail={p.submitter?.email ?? 'unknown'}
              submittedAt={new Date(p.createdAt).toLocaleDateString()}
              adminNotes={p.adminNotes ?? ''}
            />
          ))}
          {all.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No submissions yet.
            </p>
          )}
        </div>
        <Pager page={page} totalPages={totalPages(totalCount, limit)} basePath="/admin/problems" />
      </div>
    </SiteShell>
  )
}
