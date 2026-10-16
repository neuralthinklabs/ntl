import { and, asc, eq, inArray, ne, notExists, sql } from 'drizzle-orm'
import { db } from '@/db'
import { assignments, problems, profiles } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { BulkAssignForm } from '@/components/admin/bulk-assign-form'
import { ROLE_LABELS } from '@/lib/roles'
import { formatDate } from '@/lib/datetime'

export const metadata = { title: 'Assign problems' }
export const dynamic = 'force-dynamic'

export default async function AssignProblemsPage() {
  const [open, team] = await Promise.all([
    // Open problems that have no active reviewer yet (oldest first).
    db
      .select({ id: problems.id, title: problems.title, category: problems.category, createdAt: problems.createdAt })
      .from(problems)
      .where(
        and(
          inArray(problems.status, ['submitted', 'in_review', 'accepted', 'in_progress']),
          notExists(
            db
              .select({ x: sql`1` })
              .from(assignments)
              .where(and(eq(assignments.problemId, problems.id), eq(assignments.kind, 'problem_review'), ne(assignments.status, 'cancelled'))),
          ),
        ),
      )
      .orderBy(asc(problems.createdAt))
      .limit(200),
    db
      .select({ id: profiles.id, name: profiles.fullName, email: profiles.email, role: profiles.role })
      .from(profiles)
      .where(inArray(profiles.role, ['volunteer', 'core_team']))
      .orderBy(asc(profiles.fullName)),
  ])

  return (
    <>
      <AdminHeader
        title="Assign problems"
        description="Select problems, then give them to one person or split them evenly across several. Each person is emailed and sees only their own."
      />
      <BulkAssignForm
        problems={open.map((p) => ({ id: p.id, title: p.title, category: p.category, date: formatDate(p.createdAt) }))}
        people={team.map((t) => ({ id: t.id, label: t.name || t.email, role: ROLE_LABELS[t.role] ?? t.role }))}
      />
    </>
  )
}
