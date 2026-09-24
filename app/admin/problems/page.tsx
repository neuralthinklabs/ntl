import type { Metadata } from 'next'
import { desc } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { db } from '@/db'
import { problems } from '@/db/schema'
import { AdminProblemRow } from '@/components/admin/admin-problem-row'
import { requireAdminPage } from '@/lib/auth/admin'

export const metadata: Metadata = {
  title: 'Review Problems — Admin',
}

export default async function AdminProblemsPage() {
  // Centralized admin check (P0 #4) — redirects to login or /dashboard
  // as appropriate instead of re-implementing the role check here.
  await requireAdminPage('/admin/problems')

  const all = await db.query.problems.findMany({
    orderBy: [desc(problems.createdAt)],
    with: { submitter: true },
  })

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
      </div>
    </SiteShell>
  )
}
