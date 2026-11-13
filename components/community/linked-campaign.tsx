import Link from 'next/link'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { goalMilestones, goals } from '@/db/schema'
import { ProgressBar } from '@/components/site/ui'
import { money } from '@/lib/format'
import { percentFunded } from '@/lib/goals'

/** Sidebar card on a project group: the linked campaign's confirmed funding and where its milestones stand. */
export async function LinkedCampaign({ goalId }: { goalId: string }) {
  const goal = await db.query.goals.findFirst({ where: eq(goals.id, goalId) })
  if (!goal) return null
  const milestones = await db.select().from(goalMilestones).where(eq(goalMilestones.goalId, goal.id)).orderBy(asc(goalMilestones.sortOrder))
  const done = milestones.filter((m) => m.status === 'completed').length
  const current = milestones.find((m) => m.status === 'in_progress') ?? milestones.find((m) => m.status === 'upcoming')
  const pct = percentFunded(goal)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Linked campaign</p>
      <h2 className="mt-1 text-sm font-semibold text-ink"><Link href={`/goals/${goal.slug}`} className="hover:underline">{goal.title}</Link></h2>
      {goal.fundingTargetCents > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-600">
            <span className="text-ink">{money(goal.fundingRaisedCents)}</span>
            <span>{pct}% of {money(goal.fundingTargetCents)}</span>
          </div>
          <ProgressBar value={pct} label={`${goal.title} funding progress`} />
          <p className="mt-1 text-[11px] text-slate-600">Confirmed payments only.</p>
        </div>
      )}
      {milestones.length > 0 && (
        <p className="mt-3 text-xs text-slate-700">
          {done} of {milestones.length} milestones done{current ? <> · Now: <span className="font-medium text-ink">{current.name}</span></> : ''}
        </p>
      )}
    </div>
  )
}
