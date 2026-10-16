import type { Metadata } from 'next'
import { desc, eq } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { SectionLabel } from '@/components/site/ui'
import { AssignmentCard, type TeamItem } from '@/components/team/assignment-card'
import { requireTeamPage } from '@/lib/auth/admin'
import { db } from '@/db'
import { assignments, problems } from '@/db/schema'
import { formatDate } from '@/lib/datetime'
import { ROLE_LABELS } from '@/lib/roles'

export const metadata: Metadata = { title: 'My workspace', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const { user, profile } = await requireTeamPage('/team')

  // The ONLY filter that matters: rows assigned to the signed-in user.
  const rows = await db
    .select({ a: assignments, p: problems })
    .from(assignments)
    .leftJoin(problems, eq(assignments.problemId, problems.id))
    .where(eq(assignments.assigneeId, user.id))
    .orderBy(desc(assignments.createdAt))

  const items: TeamItem[] = rows.map(({ a, p }) => ({
    id: a.id,
    kind: a.kind,
    title: a.title,
    brief: a.brief,
    status: a.status,
    note: a.assigneeNote ?? '',
    due: a.dueDate ? formatDate(a.dueDate) : null,
    problem: p
      ? { title: p.title, description: p.description, category: p.category, location: p.location, context: p.context, evidenceNotes: p.evidenceNotes }
      : null,
  }))

  const active = items.filter((i) => ['assigned', 'in_progress', 'submitted'].includes(i.status))
  const closed = items.filter((i) => i.status === 'done' || i.status === 'cancelled')

  return (
    <SiteShell>
      <PageHero
        title="My workspace"
        description={`${ROLE_LABELS[profile.role] ?? 'Team'} · ${profile.ntlId}. You only see work assigned to you.`}
      />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <SectionLabel>To do ({active.length})</SectionLabel>
        <div className="mt-4 flex flex-col gap-4">
          {active.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              Nothing assigned to you right now.
            </p>
          )}
          {active.map((i) => (
            <AssignmentCard key={i.id} item={i} />
          ))}
        </div>

        {closed.length > 0 && (
          <div className="mt-14">
            <SectionLabel>Finished ({closed.length})</SectionLabel>
            <div className="mt-4 flex flex-col gap-4">
              {closed.map((i) => (
                <AssignmentCard key={i.id} item={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  )
}
