import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { goals, goalMilestones, goalUpdates } from '@/db/schema'

export async function getAllGoals() {
  return db.query.goals.findMany({ orderBy: [desc(goals.createdAt)] })
}

export async function getGoalBySlug(slug: string) {
  const goal = await db.query.goals.findFirst({ where: eq(goals.slug, slug) })
  if (!goal) return null

  const [milestones, updates] = await Promise.all([
    db.query.goalMilestones.findMany({
      where: eq(goalMilestones.goalId, goal.id),
      orderBy: [asc(goalMilestones.sortOrder)],
    }),
    db.query.goalUpdates.findMany({
      where: eq(goalUpdates.goalId, goal.id),
      orderBy: [desc(goalUpdates.createdAt)],
    }),
  ])

  return { ...goal, milestones, updates }
}

export function percentFunded(goal: { fundingRaisedCents: number; fundingTargetCents: number }) {
  if (!goal.fundingTargetCents) return 0
  return Math.min(100, Math.round((goal.fundingRaisedCents / goal.fundingTargetCents) * 100))
}
