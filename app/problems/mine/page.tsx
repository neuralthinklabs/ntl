import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { problems } from '@/db/schema'
import { StatusBadge } from '@/components/problems/status-badge'

export const metadata: Metadata = {
  title: 'My Problems — Neural Think Labs',
}

export default async function MyProblemsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/problems/mine')

  const mine = await db.query.problems.findMany({
    where: eq(problems.submittedBy, user.id),
    orderBy: [desc(problems.createdAt)],
  })

  return (
    <SiteShell>
      <PageHero title="My Problems" description="Everything you've submitted, and its review status." />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            You haven&apos;t submitted a problem yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {mine.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{p.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Submitted {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {p.attachmentsIncomplete && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                    One or more attachments failed to upload with this submission.
                  </p>
                )}
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.description}</p>
                {p.adminNotes && (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                    <span className="font-medium text-ink">Team note: </span>
                    {p.adminNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  )
}
