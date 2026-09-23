import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { problems, profiles } from '@/db/schema'
import { AdminProblemRow } from '@/components/admin/admin-problem-row'

export const metadata: Metadata = {
  title: 'Review Problems — Admin',
}

export default async function AdminProblemsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/problems')

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
  if (profile?.role !== 'admin') redirect('/dashboard')

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
